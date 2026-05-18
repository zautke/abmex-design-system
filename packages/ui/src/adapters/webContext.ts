// WebContextAdapter — abstract over src/context/web/WebContextProvider.

export interface WebPageContent {
  url: string;
  title: string;
  markdown: string;
}

export interface WebContextAdapter {
  getActivePageContent(): Promise<WebPageContent | null>;
  getActivePageHash(): Promise<string | null>;
}
