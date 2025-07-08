export default {
  async fetch (request) {
    if (request.method === "OPTIONS") {
      return handleOPTIONS();
    }
    const errHandler = (err) => {
      console.error(err);
      return new Response(err.message, fixCors({ status: err.status ?? 500 }));
    };
    try {
      const auth = request.headers.get("Authorization");
      const apiKey = auth?.split(" ")[1];
      const assert = (success) => {
        if (!success) {
          throw new HttpError("The specified HTTP method is not allowed for the requested resource", 400);
        }
      };
      const { pathname } = new URL(request.url);
      switch (true) {
        case pathname.endsWith("/chat/completions"):
          assert(request.method === "POST");
          return handleCompletions(request, apiKey)
            .catch(errHandler);
        case pathname.endsWith("/models"):
          assert(request.method === "GET");
          return handleModels(apiKey)
            .catch(errHandler);
        default:
          throw new HttpError("404 Not Found", 404);
      }
    } catch (err) {
      return errHandler(err);
    }
  }
};

class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}

const fixCors = ({ headers, status, statusText }) => {
  headers = new Headers(headers);
  headers.set("Access-Control-Allow-Origin", "*");
  return { headers, status, statusText };
};

const handleOPTIONS = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
    }
  });
};

const OPENAI_API_URL = "https://api.ai-wave.org/v1/chat/completions";
const MODELS_API_URL = "https://api.ai-wave.org/v1/models";

const makeHeaders = (apiKey, more) => ({
  ...(apiKey && { "Authorization": `Bearer ${apiKey}` }),
  ...more
});

async function handleModels (apiKey) {
  const response = await fetch(MODELS_API_URL, {
    headers: makeHeaders(apiKey)
  });
  return new Response(response.body, fixCors(response));
}

async function handleCompletions (request, apiKey) {
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: makeHeaders(apiKey, {
      "Content-Type": "application/json"
    }),
    body: request.body
  });

  return new Response(response.body, fixCors(response));
}




