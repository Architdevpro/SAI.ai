interface DuckDuckGoResult {
  Abstract?: string;
  AbstractText?: string;
  AbstractSource?: string;
  AbstractURL?: string;
  Answer?: string;
  AnswerType?: string;
  Definition?: string;
  DefinitionSource?: string;
  DefinitionURL?: string;
  Heading?: string;
  Image?: string;
  ImageIsLogo?: number;
  Infobox?: any;
  Redirect?: string;
  RelatedTopics?: Array<{
    Result?: string;
    FirstURL?: string;
    Text?: string;
  }>;
  Results?: Array<{
    Result?: string;
    FirstURL?: string;
    Text?: string;
  }>;
  Type?: string;
}

export class DuckDuckGoService {
  private baseUrl = "https://api.duckduckgo.com/";

  async search(query: string): Promise<{
    success: boolean;
    data?: DuckDuckGoResult;
    summary?: string;
    sources?: string[];
    error?: string;
  }> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.baseUrl}?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        return {
          success: false,
          error: `DuckDuckGo API error: ${response.status}`,
        };
      }

      const data: DuckDuckGoResult = await response.json();
      
      // Extract meaningful information
      const summary = this.extractSummary(data);
      const sources = this.extractSources(data);

      return {
        success: true,
        data,
        summary,
        sources,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to search: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  private extractSummary(data: DuckDuckGoResult): string {
    // Priority order for extracting summary information
    if (data.Answer) {
      return data.Answer;
    }
    
    if (data.AbstractText) {
      return data.AbstractText;
    }
    
    if (data.Definition) {
      return data.Definition;
    }
    
    // Check related topics for useful information
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      const firstTopic = data.RelatedTopics[0];
      if (firstTopic.Text) {
        return firstTopic.Text;
      }
    }
    
    // Check results for useful information
    if (data.Results && data.Results.length > 0) {
      const firstResult = data.Results[0];
      if (firstResult.Text) {
        return firstResult.Text;
      }
    }
    
    return "No specific information found from search results.";
  }

  private extractSources(data: DuckDuckGoResult): string[] {
    const sources: string[] = [];
    
    if (data.AbstractSource) {
      sources.push(data.AbstractSource);
    }
    
    if (data.DefinitionSource) {
      sources.push(data.DefinitionSource);
    }
    
    if (data.AbstractURL) {
      sources.push(data.AbstractURL);
    }
    
    if (data.DefinitionURL) {
      sources.push(data.DefinitionURL);
    }
    
    // Add URLs from related topics
    if (data.RelatedTopics) {
      data.RelatedTopics.forEach(topic => {
        if (topic.FirstURL) {
          sources.push(topic.FirstURL);
        }
      });
    }
    
    // Add URLs from results
    if (data.Results) {
      data.Results.forEach(result => {
        if (result.FirstURL) {
          sources.push(result.FirstURL);
        }
      });
    }
    
    // Remove duplicates and limit to 5 sources
    return Array.from(new Set(sources)).slice(0, 5);
  }

  async getInstantAnswer(query: string): Promise<{
    success: boolean;
    answer?: string;
    type?: string;
    error?: string;
  }> {
    try {
      const result = await this.search(query);
      
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || "No data received",
        };
      }

      const { data } = result;
      
      if (data.Answer) {
        return {
          success: true,
          answer: data.Answer,
          type: data.AnswerType || "instant",
        };
      }
      
      if (data.AbstractText) {
        return {
          success: true,
          answer: data.AbstractText,
          type: "abstract",
        };
      }
      
      return {
        success: false,
        error: "No instant answer available",
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get instant answer: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }
}

export const duckDuckGoService = new DuckDuckGoService();
    
