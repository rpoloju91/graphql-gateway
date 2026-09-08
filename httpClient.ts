type RequestOptions = {
  method: string;
  headers?: Record<string, string>;
  body?: any;
};

export async function httpClient(
  url: string,
  options: RequestOptions,
  logger: any,
  context: any
) {
  const { method, headers = {}, body } = options;

  const requestId = context?.requestId;
  const token = context?.token;
  const tenantId = context?.tenantId;

  const cookie = context?.req?.headers?.cookie;

  const commonHeaders: Record<string, string> = {
    "Content-Type": "application/json",

    ...headers,
  };

  // Authorization
  if (token) {
    commonHeaders["Authorization"] = token;
  }

  // Request tracking
  if (requestId) {
    commonHeaders["X-Request-Id"] = requestId;
  }

  // Tenant
  if (tenantId) {
    commonHeaders["tenantId"] = tenantId;
  }

  // Cookies including OneTrust cookie
  if (cookie) {
    commonHeaders["Cookie"] = cookie;
  }

  logger.info("HTTP Request start", {
    method,
    url,
    requestId,
  });

  const response = await fetch(url, {
    method,
    headers: commonHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  logger.info("HTTP Request completed", {
    method,
    url,
    requestId,
    status: response.status,
  });

  if (!response.ok) {
    const responseText = await response.text();

    logger.error("HTTP Request failed", {
      method,
      url,
      requestId,
      status: response.status,
      response: responseText,
    });

    throw new Error(
      `HTTP request failed with status ${response.status}`
    );
  }

  const responseData = await response.text();

  try {
    return JSON.parse(responseData);
  } catch {
    return responseData;
  }
}
