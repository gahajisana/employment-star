import { createCache, extractStyle, StyleProvider } from "@ant-design/cssinjs";
import { renderToReadableStream } from "react-dom/server";
import { ServerRouter, type EntryContext } from "react-router";

export const streamTimeout = 5_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  const cache = createCache();
  const body = await renderToReadableStream(
    <StyleProvider cache={cache}>
      <ServerRouter context={routerContext} url={request.url} />
    </StyleProvider>,
    {
      signal: AbortSignal.timeout(streamTimeout + 1000),
      onError(error: unknown) {
        responseStatusCode = 500;
        console.error(error);
      },
    },
  );

  // Wait for the whole tree so styles from suspended components are included.
  // For prerendered routes this work happens only at build time.
  await body.allReady;
  const styles = extractStyle(cache);
  let head = "";
  let inserted = false;
  const withStyles = body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(
      new TransformStream<string, string>({
        transform(chunk, controller) {
          if (inserted) {
            controller.enqueue(chunk);
            return;
          }
          head += chunk;
          const end = head.indexOf("</head>");
          if (end !== -1) {
            controller.enqueue(head.slice(0, end) + styles + head.slice(end));
            head = "";
            inserted = true;
          }
        },
        flush(controller) {
          if (head) controller.enqueue(head);
        },
      }),
    )
    .pipeThrough(new TextEncoderStream());

  responseHeaders.set("Content-Type", "text/html");
  return new Response(withStyles, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
