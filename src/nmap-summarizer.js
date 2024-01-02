import { LitElement, html, css } from "lit";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { resolveMarkdown } from "lit-markdown";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";
import "@shoelace-style/shoelace/dist/components/dialog/dialog.js";
import "@shoelace-style/shoelace/dist/components/textarea/textarea.js";
import "@shoelace-style/shoelace/dist/components/input/input.js";

const MODEL_NAME = "gemini-pro";

async function run(apiKey, nmapInput) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const parts = [
    {
      text: `Given the NMAP OUTPUT below, summarize it in the following format.
      The output must be valid markdown:
      
        summary: a non-technical summary in a couple of sentences
        details: step-by-step comprehensive explanation that an expert can quickly scan and understand
        graph: graphviz code that represents the host and the open ports with labels for each port
      
        NMAP OUTPUT:
        ${nmapInput}
        RESPONSE:`,
    },
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  const response = result.response;
  return response.text();
}

export class NmapSummarizer extends LitElement {
  static get properties() {
    return {
      results: { type: String },
      geminiKey: { type: String },
      loading: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.results = "Click Summarize to view results (may take a few moments)";
    this.geminiKey = localStorage.getItem("GEMINI_KEY");
    this.loading = false;
  }

  render() {
    return html`<section>
        <h1>Nmap Summarizer</h1>
        <div>
          <sl-input
            type="password"
            placeholder="Paste Gemini API Key here"
            value=${this.geminiKey}
          ></sl-input>
        </div>
        <div>
          <sl-textarea
            placeholder="Paste Nmap output here (use nmap -sC -sV -oA)"
            rows="12"
          ></sl-textarea>
        </div>
        <div>
          <sl-button
            ?loading=${this.loading}
            ?disabled=${this.loading}
            @click=${this.#onClick}
            >Summarize!</sl-button
          >
        </div>
      </section>
      <section>
        <h1>Results</h1>
        <div>${resolveMarkdown(this.results)}</div>
      </section>`;
  }
  async #onClick() {
    const geminiKey = this.shadowRoot.querySelector(`sl-input`).value;
    localStorage.setItem("GEMINI_KEY", geminiKey);
    const nmapInput = this.shadowRoot.querySelector(`sl-textarea`).value;
    console.log(geminiKey);
    console.log("Clicked!");
    console.log(nmapInput);
    this.loading = true;
    this.results = await run(geminiKey, nmapInput);
    this.loading = false;
  }
  static get styles() {
    return css`
      section {
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      div {
        padding-bottom: 10px;
      }
      :host {
        display: flex;
        flex: 1;
      }

      button {
        padding: 10px;
      }
      section {
        padding-left: 10px;
      }
      input {
        width: 400px;
        padding: 10px;
        margin-bottom: 10px;
      }
      textarea {
        height: 300px;
        width: 500px;
      }
    `;
  }
}

window.customElements.define("nmap-summarizer", NmapSummarizer);
