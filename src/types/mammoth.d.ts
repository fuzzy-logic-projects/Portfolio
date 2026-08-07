declare module 'mammoth/mammoth.browser.min.js' {
  interface ConvertToHtmlResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  interface ConvertToHtmlOptions {
    arrayBuffer: ArrayBuffer;
  }

  const mammoth: {
    convertToHtml(options: ConvertToHtmlOptions): Promise<ConvertToHtmlResult>;
  };

  export default mammoth;
}
