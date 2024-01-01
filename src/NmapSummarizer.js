import { LitElement, html } from "lit";

export class NmapSummarizer extends LitElement {
  render() {
    return html`<h1>Nmap Summarizer</h1>
      <div>Gemini API Key<input /></div>
      <div><textarea></textarea></div>
      <div><button @click=${this.#onClick}>Summarize!</button></div>`;
  }
  #onClick() {
    console.log("Clicked!");
  }
  static get styles() {
    return css``;
  }
}
