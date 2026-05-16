let controller: AbortController | null = null;

export function getFetchSignal(): AbortSignal | undefined {
  return controller?.signal;
}

export function abortAllRequests(): void {
  if (controller) {
    controller.abort();
  }
  controller = new AbortController();
}
