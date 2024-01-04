import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js";
setBasePath("/");

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
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";

import "graphviz-webcomponent/bundled";

const stripCodeBlock = (code) =>
  code.replace(/(?:```(?:graphviz)?\n+)(.*)(?:\n+```)/gms, "$1");

const MODEL_NAME = "gemini-pro";

const markdownInput = (nmapInput) => [
  {
    text: `Given the NMAP OUTPUT below, summarize it in the following format.
    The output must be valid markdown:
    
      summary: a non-technical summary in a couple of sentences
      details: step-by-step comprehensive explanation that an expert can quickly scan and understand
      tools: give suggestions for some networking or cybersecurity tools that can be used to better understand the Nmap results
    
      NMAP OUTPUT:
      ${nmapInput}
      RESPONSE:`,
  },
];

const graphvizInput = (nmapInput) => [
  {
    text: `Given the NMAP OUTPUT below, create color coded graphviz code with open and closed ports, identified and unidentified software, and full network topology.

      NMAP OUTPUT:
      ${nmapInput}
      RESPONSE:`,
  },
];

async function run(apiKey, input) {
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

  const result = await model.generateContent({
    contents: [{ role: "user", parts: input }],
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
      graphviz: { type: String },
    };
  }

  constructor() {
    super();
    this.results = "Click Summarize to view results (may take a few moments)";
    this.geminiKey = localStorage.getItem("GEMINI_KEY");
    this.loading = false;
    this.graphviz = "";
  }

  render() {
    return html` <div id="github">
        <sl-icon-button
          name="github"
          label="View code on Github"
          href="https://github.com/nicglazkov/nmap-summarizer"
          target="_blank"
        ></sl-icon-button>
      </div>

      <section class="panel">
        <section>
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
        </section>
        <section>
          <graphviz-graph
            graph="${stripCodeBlock(this.graphviz)}"
          ></graphviz-graph>
        </section>
      </section>`;
  }
  async #onClick() {
    const geminiKey = this.shadowRoot.querySelector(`sl-input`).value;
    localStorage.setItem("GEMINI_KEY", geminiKey);
    const nmapInput = this.shadowRoot.querySelector(`sl-textarea`).value;
    // console.log(geminiKey);
    // console.log("Clicked!");
    // console.log(nmapInput);
    this.loading = true;
    run(geminiKey, markdownInput(nmapInput)).then((value) => {
      this.results = value;
    });
    this.graphviz = await run(geminiKey, graphvizInput(nmapInput));
    this.loading = false;
  }
  static get styles() {
    return css`
      section.panel {
        display: flex;
        flex-direction: row;
        flex: 1;
      }
      div {
        padding-bottom: 10px;
      }
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      #github {
        display: flex;
        justify-content: right;
        font-size: 32px;
        padding-bottom: 0;
      }

      button {
        padding: 10px;
      }
      section {
        padding-left: 10px;
        flex: 1;
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
