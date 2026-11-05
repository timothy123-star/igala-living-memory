let sourceId = "ad1e919e-3ffb-42bd-9368-6c3d5db48dd1";
const archiveStatus = document.querySelector("#archive-status");
const archiveContent = document.querySelector("#archive-content");
const archiveError = document.querySelector("#archive-error");
const generationResult = document.querySelector("#generation-result");
const generateButton = document.querySelector("#generate-button");
const sourceSelect = document.querySelector("#source-select");

function lines(text) {
  return text.split("\n").map((line, index) => line.replace(/^\d+\.\s*/, "").trim()).filter(Boolean).map((text, index) => ({ number: index + 1, text }));
}
function addPerson(name, role) {
  const card = document.createElement("article");
  card.className = "person";
  card.innerHTML = `<p>${role}</p><h3>${name}</h3>`;
  document.querySelector("#people-grid").append(card);
}
function displayArchive(archive) {
  const transcription = archive.transcriptions[0];
  const interpretation = transcription.interpretations[0];
  document.querySelector("#source-title").textContent = archive.source.title || "Untitled contribution";
  document.querySelector("#source-context").textContent = archive.source.context || "Context not supplied.";
  document.querySelector("#source-language").textContent = archive.source.sourceLanguage;
  document.querySelector("#source-format").textContent = archive.source.mimeType.replace("audio/", "").toUpperCase();
  document.querySelector("#audio-status").textContent = archive.audio.reason;
  addPerson(archive.contributor.publicLabel, "Speaker / contributor");
  addPerson(transcription.transcriber.publicLabel, "Human transcriber");
  addPerson(interpretation.translator.publicLabel, "Interpretation attribution");
  addPerson(transcription.reviewer.publicLabel, "Human reviewer");
  document.querySelector("#consent-status").textContent = `${archive.consent.status} consent`;
  archive.consent.permissions.forEach((permission) => {
    const badge = document.createElement("span");
    badge.textContent = `${permission.granted ? "Granted" : "Not granted"}: ${permission.purpose.replaceAll("_", " ")}`;
    if (!permission.granted) badge.className = "denied";
    document.querySelector("#permission-list").append(badge);
  });
  const provenance = [["Source ID", archive.source.id], ["Review state", archive.source.reviewStatus.replaceAll("_", " ")], ["Consent record", archive.consent.id], ["Archive access", archive.audio.availability]];
  provenance.forEach(([term, value]) => { const dt = document.createElement("dt"); const dd = document.createElement("dd"); dt.textContent = term; dd.textContent = value; document.querySelector("#provenance-list").append(dt, dd); });
  const igala = lines(transcription.record.originalText);
  const english = lines(interpretation.record.interpretationText);
  igala.forEach((line, index) => {
    const row = document.createElement("article"); row.className = "proverb-row";
    row.innerHTML = `<span class="number">${line.number.toString().padStart(2, "0")}</span><p lang="ig">${line.text}</p><p class="english">${english[index]?.text || "—"}</p>`;
    document.querySelector("#proverb-rows").append(row);
  });
  [["Igala transcription", transcription.record, transcription.reviewer], ["English interpretation", interpretation.record, interpretation.reviewer]].forEach(([title, record, reviewer]) => {
    const card = document.createElement("article"); card.className = "review-card";
    card.innerHTML = `<p class="status">${record.reviewStatus}</p><h3>${title}</h3><p>${record.reviewNote || "No reviewer note supplied."}</p><p><strong>Reviewed by:</strong> ${reviewer.publicLabel}</p>`;
    document.querySelector("#review-grid").append(card);
  });
  archiveStatus.textContent = "Live data from the consented archive";
  archiveContent.hidden = false;
}
async function loadArchive() {
  try { const response = await fetch(`/api/v1/sources/${sourceId}/archive`); if (!response.ok) throw new Error("Archive request failed"); displayArchive((await response.json()).data.archive); }
  catch { archiveStatus.hidden = true; archiveError.hidden = false; }
}
async function loadSourceChoices() {
  try {
    const response = await fetch("/api/v1/sources");
    if (!response.ok) throw new Error("Source list unavailable");
    const sources = (await response.json()).data.sources;
    sources.forEach((source) => {
      const option = document.createElement("option");
      option.value = source.id;
      option.textContent = `${source.title || "Untitled contribution"} — ${source.reviewStatus.replaceAll("_", " ")}`;
      option.selected = source.id === sourceId;
      sourceSelect.append(option);
    });
  } catch {
    const option = document.createElement("option");
    option.value = sourceId;
    option.textContent = "Igala Proverbs — pending review";
    sourceSelect.append(option);
  }
}
async function generate() {
  const prompt = document.querySelector("#learning-prompt").value.trim();
  if (!prompt) return;
  generateButton.disabled = true; generateButton.textContent = "Checking safeguards…";
  generationResult.className = "generation-result loading"; generationResult.textContent = "Checking consent, approval, and verified archive evidence before contacting Muse Spark…";
  try {
    const response = await fetch(`/api/v1/sources/${sourceId}/educational-content`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt }) });
    const body = await response.json();
    if (response.ok) {
      const lesson = body.data.lesson;
      generationResult.className = "generation-result success";
      generationResult.innerHTML = `<strong>AI-generated — not human-verified</strong><h3>${lesson.title}</h3><p>${lesson.explanation}</p><h4>Learning objectives</h4><ul>${lesson.learningObjectives.map((item) => `<li>${item}</li>`).join("")}</ul><h4>Source-grounded proverb activity</h4>${lesson.proverbActivities.map((item) => `<p><strong>${item.igala}</strong><br>${item.interpretation}<br>${item.activity}</p>`).join("")}<h4>Comprehension</h4><ul>${lesson.comprehensionQuestions.map((item) => `<li>${item.question}<br><em>Answer: ${item.answer}</em></li>`).join("")}</ul><h4>Quiz</h4><ul>${lesson.quizQuestions.map((item) => `<li>${item.question}<br><em>Answer: ${item.answer}</em></li>`).join("")}</ul><p><strong>Evidence:</strong> ${lesson.evidenceStatement}</p><p>Source references: ${body.data.sourceReferences.map((ref) => ref.transcriptionId).join(", ")}</p>`;
    }
    else if (body.status === "insufficient_evidence") { generationResult.className = "generation-result refused"; generationResult.innerHTML = `<strong>Generation responsibly refused.</strong><p>${body.message}</p><ul>${body.reasons.map((reason) => `<li>${reason}</li>`).join("")}</ul><p>No model request was made.</p>`; }
    else throw new Error(body.message || "Generation request failed");
  } catch (error) { generationResult.className = "generation-result refused"; generationResult.textContent = error.message || "The request could not be completed."; }
  finally { generateButton.disabled = false; generateButton.innerHTML = "Generate with Muse Spark <span aria-hidden=\"true\">→</span>"; }
}
generateButton.addEventListener("click", generate);
sourceSelect.addEventListener("change", () => { sourceId = sourceSelect.value; });
loadSourceChoices();
loadArchive();
