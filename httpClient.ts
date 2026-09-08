type RequestOptions = {
  method: string;
  headers?: Record<string, string>;
  body?: any;
};

export async function httpClient(
  url: string,
  options: RequestOptions,
  logger: any,
  context?: any
) {

  const { method, headers, body } = options;


  // ==========================================
  // CENTRALIZED HEADERS
  // ==========================================

  const commonHeaders: Record<string, string> = {
    "Content-Type": "application/json",

    // Keep any headers passed by individual APIs
    ...headers,
  };


  // 1. Authorization token
  if (context?.token) {
    commonHeaders["Authorization"] = context.token;
  }


  // 2. Request ID - end-to-end tracking
  if (context?.requestId) {
    commonHeaders["X-Request-Id"] = context.requestId;
  }


  // 3. Tenant ID
  if (context?.tenantId) {
    commonHeaders["tenantId"] = context.tenantId;
  }


  // 4. Forward frontend cookies
  // This will include OneTrust cookies automatically
  const cookie = context?.req?.headers?.cookie;

  if (cookie) {
    commonHeaders["Cookie"] = cookie;
  }


  // ==========================================
  // YOUR EXISTING CODE
  // ==========================================

  logger.info("HTTP Request start", {
    method,
    url,
    headers: commonHeaders,
    body,
  });


  const response = await fetch(url, {

    method: method,

    headers: {
      ...commonHeaders,
    },

    body: body ? JSON.stringify(body) : undefined,

  });


  logger.info("executed");


  if (!response.ok) {

    const text = await response.text();

    let responseMessage = "An Unexpected error occured";


    if (response.status == 401) {

      responseMessage =
        "Your session has expired or you are not authorized";

    } else if (response.status == 404) {

      responseMessage =
        "Bad request or The requested information could not be found on the server";

    } else if (response.status == 500) {

      responseMessage =
        "The backend server is currently having trouble, Please try again ";

    }


    logger.error("HTTP Request failed", {

      status: response.status,

      body: text,

      requestId: context?.requestId,

    });


    throw new Error(
      `HTTP error! status: ${response.status}` + responseMessage
    );
  }


  const responseData = await response.text();

  logger.info(responseData);


  try {

    return JSON.parse(responseData);

  } catch (error) {

    return responseData;

  }

}
