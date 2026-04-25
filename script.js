const testConfig = { questionsPerDimension: 50, totalQuestions: 200, dimensions: ["EI", "SN", "TF", "JP"] };
let testState = { currentQuestion: 0, answers: new Array(200).fill(0), currentDimension: "EI", testCompleted: false, autoJumpTimer: null };
const elements = {};

function init() {
    // 元素获取保持不变
    elements.homePage = document.getElementById("home");
    elements.testPage = document.getElementById("test");
    elements.resultsPage = document.getElementById("results");
    elements.typesPage = document.getElementById("types");
    elements.historyPage = document.getElementById("history");
    elements.progressText = document.getElementById("progressText");
    elements.progressBar = document.getElementById("progressBar");
    elements.questionText = document.getElementById("questionText");
    elements.optionButtons = document.querySelectorAll(".btn-option");
    elements.prevBtn = document.getElementById("prevBtn");
    elements.typeCode = document.getElementById("typeCode");
    elements.typeName = document.getElementById("typeName");
    elements.typeImage = document.getElementById("typeImage");
    elements.dimensionScoreContainer = document.getElementById("dimensionScoreContainer");
    elements.summaryTraits = document.getElementById("summaryTraits");
    elements.summaryDecision = document.getElementById("summaryDecision");
    elements.summaryWork = document.getElementById("summaryWork");
    elements.summaryRelationships = document.getElementById("summaryRelationships");
    elements.summaryStress = document.getElementById("summaryStress");
    elements.startTestBtn = document.getElementById("startTest");
    elements.restartTestBtn = document.getElementById("restartTest");
    elements.moreTests = document.getElementById("moreTests");
    elements.continueTestContainer = document.getElementById("continueTestContainer");
    elements.continueTestBtn = document.getElementById("continueTest");
    elements.historyList = document.getElementById("historyList");
    elements.historyPageList = document.getElementById("historyPageList");

    bindEvents();
    bindResultStyleEvents();
    showSection("home");
    initOptionButtons();
    loadSavedProgress();
    updateContinueButton();
    renderHistoryOnPage();
}

function bindEvents() {
    elements.startTestBtn.addEventListener("click", () => { resetTest(); clearSavedProgress(); showSection("test"); setTimeout(() => loadQuestion(0), 100); });
    elements.continueTestBtn.addEventListener("click", () => { showSection("test"); setTimeout(() => loadQuestion(testState.currentQuestion), 100); });
    elements.restartTestBtn.addEventListener("click", () => { if(confirm("确定重新开始？进度将丢失。")) { resetTest(); clearSavedProgress(); showSection("test"); setTimeout(() => loadQuestion(0), 100); } });
    elements.moreTests.addEventListener("click", () => window.open("https://xhslink.com/m/2kA9NoP025G", "_blank"));
    elements.prevBtn.addEventListener("click", () => { if(testState.currentQuestion > 0) { if(testState.autoJumpTimer) clearTimeout(testState.autoJumpTimer); loadQuestion(testState.currentQuestion - 1); } });
}

function bindResultStyleEvents() {
    document.getElementById('viewResultBtn').addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('styleModal'));
        modal.show();
    });
    document.querySelectorAll('.style-option').forEach(btn => {
        btn.addEventListener('click', function() {
            const style = this.dataset.style;
            bootstrap.Modal.getInstance(document.getElementById('styleModal')).hide();
            const scores = calculateScores();
            const type = determinePersonalityType(scores);
            showSection('results');
            setTimeout(() => displayResultsWithStyle(scores, type, style), 100);
        });
    });
}

function initOptionButtons() {
    elements.optionButtons.forEach(btn => { btn.addEventListener("click", function() { const val = parseInt(this.dataset.value); elements.optionButtons.forEach(b => b.classList.remove("selected")); this.classList.add("selected"); testState.answers[testState.currentQuestion] = val; saveProgress(); if(testState.autoJumpTimer) clearTimeout(testState.autoJumpTimer); testState.autoJumpTimer = setTimeout(() => autoJumpToNextQuestion(), 50); }); });
}

function autoJumpToNextQuestion() {
    const idx = testState.currentQuestion;
    if (idx < 199) { loadQuestion(idx + 1); } else { showTestCompleteScreen(); }
    testState.autoJumpTimer = null;
}

function showTestCompleteScreen() {
    document.querySelector('.question-container').style.display = 'none';
    document.querySelector('.navigation-buttons').style.display = 'none';
    document.querySelector('.auto-jump-notice').style.display = 'none';
    document.getElementById('instructionAlert').style.display = 'none';
    document.getElementById('testComplete').style.display = 'block';
    updateProgress();
    clearSavedProgress();
}

function showSection(id) {
    document.querySelectorAll(".section").forEach(s => { s.style.display = "none"; s.classList.remove("active"); });
    const target = document.getElementById(id);
    if(target) { target.style.display = "block"; setTimeout(() => target.classList.add("active"), 10); 
        if(id === "types") generatePersonalityMatrix(); 
        if(id === "test") { 
            document.getElementById('testComplete').style.display = 'none'; 
            document.querySelector('.question-container').style.display = 'block'; 
            document.querySelector('.navigation-buttons').style.display = 'block'; 
            document.querySelector('.auto-jump-notice').style.display = 'block'; 
            document.getElementById('instructionAlert').style.display = 'block'; 
            loadQuestion(testState.currentQuestion); 
        }
    }
    if (id === "history") renderHistoryOnPage();
}

function loadQuestion(idx) {
    if(idx >= 200) return;
    testState.currentQuestion = idx;
    updateProgress();
    updateDimensionIndicator();
    const q = getCurrentQuestion();
    if(!q) return;
    elements.questionText.textContent = q.text;
    const saved = testState.answers[idx];
    elements.optionButtons.forEach(b => b.classList.remove("selected"));
    if(saved > 0) { const sel = document.querySelector(`.btn-option[data-value="${saved}"]`); if(sel) sel.classList.add("selected"); }
    elements.prevBtn.disabled = (idx === 0);
    saveProgress();
}

function getCurrentQuestion() {
    let dim, i;
    if(testState.currentQuestion < 50) { dim = "EI"; i = testState.currentQuestion; }
    else if(testState.currentQuestion < 100) { dim = "SN"; i = testState.currentQuestion - 50; }
    else if(testState.currentQuestion < 150) { dim = "TF"; i = testState.currentQuestion - 100; }
    else { dim = "JP"; i = testState.currentQuestion - 150; }
    testState.currentDimension = dim;
    return mbtiQuestions[dim][i];
}

function updateProgress() { const p = ((testState.currentQuestion + 1) / 200) * 100; elements.progressText.textContent = `${testState.currentQuestion + 1}/200`; elements.progressBar.style.width = `${p}%`; }

function updateDimensionIndicator() {
    document.querySelectorAll(".dimension-btn").forEach(b => { b.style.display = "none"; b.classList.remove("active"); });
    const active = document.querySelector(`.dimension-btn[data-dim="${testState.currentDimension}"]`);
    if(active) { active.style.display = "inline-block"; active.classList.add("active"); }
}

// 进度保存与恢复
function saveProgress() { const data = { answers: testState.answers, currentQuestion: testState.currentQuestion }; localStorage.setItem("mbtiTestProgress", JSON.stringify(data)); }
function clearSavedProgress() { localStorage.removeItem("mbtiTestProgress"); updateContinueButton(); }
function loadSavedProgress() { try { const saved = JSON.parse(localStorage.getItem("mbtiTestProgress")); if (saved && saved.answers && saved.currentQuestion !== undefined) { testState.answers = saved.answers; testState.currentQuestion = saved.currentQuestion; } } catch(e) {} updateContinueButton(); }
function updateContinueButton() { const saved = localStorage.getItem("mbtiTestProgress"); elements.continueTestContainer.style.display = saved ? "block" : "none"; }

// 历史记录
function saveHistory(result) { let history = []; try { history = JSON.parse(localStorage.getItem("mbtiTestHistory") || "[]"); } catch(e){} history.unshift(result); if (history.length > 3) history = history.slice(0, 3); localStorage.setItem("mbtiTestHistory", JSON.stringify(history)); }
function getHistory() { try { return JSON.parse(localStorage.getItem("mbtiTestHistory") || "[]"); } catch(e){ return []; } }
function renderHistoryList(container) { const history = getHistory(); if (!container) return; if (history.length === 0) { container.innerHTML = '<p class="text-muted text-center">暂无历史记录</p>'; return; } let html = ''; history.forEach(item => { html += `<div class="list-group-item"><div class="d-flex justify-content-between align-items-center"><div><span class="badge bg-primary me-2">${item.type}</span><span>${mbtiReports[item.type]?.typeName || ''}</span></div><small class="text-muted">${new Date(item.timestamp).toLocaleString()}</small></div><div class="mt-2 small"><span class="me-3">E:${item.scores.EI.E}/I:${item.scores.EI.I}</span><span class="me-3">S:${item.scores.SN.S}/N:${item.scores.SN.N}</span><span class="me-3">T:${item.scores.TF.T}/F:${item.scores.TF.F}</span><span>J:${item.scores.JP.J}/P:${item.scores.JP.P}</span></div></div>`; }); container.innerHTML = html; }
function renderHistoryOnPage() { if (elements.historyList) renderHistoryList(elements.historyList); if (elements.historyPageList) renderHistoryList(elements.historyPageList); }

// 分数计算
function calculateScores() {
    const sc = { EI: { E:0, I:0 }, SN: { S:0, N:0 }, TF: { T:0, F:0 }, JP: { J:0, P:0 } };
    for(let i=0; i<50; i++) { let q = mbtiQuestions.EI[i], ans = testState.answers[i]; if(ans>0) { let v = q.reverse ? 8-ans : ans; sc.EI.E += v; sc.EI.I += (8-v); } }
    for(let i=0; i<50; i++) { let q = mbtiQuestions.SN[i], ans = testState.answers[i+50]; if(ans>0) { let v = q.reverse ? 8-ans : ans; sc.SN.S += v; sc.SN.N += (8-v); } }
    for(let i=0; i<50; i++) { let q = mbtiQuestions.TF[i], ans = testState.answers[i+100]; if(ans>0) { let v = q.reverse ? 8-ans : ans; sc.TF.T += v; sc.TF.F += (8-v); } }
    for(let i=0; i<50; i++) { let q = mbtiQuestions.JP[i], ans = testState.answers[i+150]; if(ans>0) { let v = q.reverse ? 8-ans : ans; sc.JP.J += v; sc.JP.P += (8-v); } }
    return sc;
}
function determinePersonalityType(sc) { return (sc.EI.E > sc.EI.I ? "E" : "I") + (sc.SN.S > sc.SN.N ? "S" : "N") + (sc.TF.T > sc.TF.F ? "T" : "F") + (sc.JP.J > sc.JP.P ? "J" : "P"); }

// 展示结果
function displayResultsWithStyle(scores, typeCode, styleChoice) {
    elements.typeCode.textContent = typeCode;
    const reportData = mbtiReports[typeCode]; if(!reportData) return;
    let variant;
    if (styleChoice === 'random') { const styles = ['poetic','sharp','analytical']; variant = reportData.variants[styles[Math.floor(Math.random()*styles.length)]]; }
    else { variant = reportData.variants[styleChoice]; }
    elements.typeName.textContent = reportData.typeName;
    if(elements.typeImage) { elements.typeImage.src = `images/${typeCode}.png`; elements.typeImage.style.display = 'block'; }
    const themeClass = styleChoice === 'sharp' ? 'theme-sharp' : styleChoice === 'analytical' ? 'theme-analytical' : '';
    document.documentElement.className = themeClass;
    renderDeepReport(variant);
    updateDimensionDisplay(scores);
    createRadarChart(scores);
    fillSummaryCards(variant);
    const historyEntry = { type: typeCode, scores: scores, timestamp: Date.now(), style: styleChoice };
    saveHistory(historyEntry);
    renderHistoryOnPage();
}

function fillSummaryCards(variant) {
    const dimData = variant.sections.dimensions.data; const firstDimKey = Object.keys(dimData)[0];
    const career = variant.sections.realLife?.career; const relationship = variant.sections.realLife?.relationship; const stress = variant.sections.cognitiveStack?.loopWarning;
    elements.summaryTraits.textContent = variant.reportTitle || '';
    elements.summaryDecision.textContent = (dimData[firstDimKey]?.text || '').substring(0,30)+'…';
    elements.summaryWork.textContent = (career?.talent || '').substring(0,30)+'…';
    elements.summaryRelationships.textContent = (relationship?.loveExpression || '').substring(0,30)+'…';
    elements.summaryStress.textContent = (stress?.feelLike || '').substring(0,30)+'…';
}

function updateDimensionDisplay(sc) {
    const container = elements.dimensionScoreContainer; if(!container) return;
    const dims = [
        { label:'能量倾向', left:'E', right:'I', leftScore:sc.EI.E, rightScore:sc.EI.I },
        { label:'认知方式', left:'S', right:'N', leftScore:sc.SN.S, rightScore:sc.SN.N },
        { label:'决策模式', left:'T', right:'F', leftScore:sc.TF.T, rightScore:sc.TF.F },
        { label:'生活态度', left:'J', right:'P', leftScore:sc.JP.J, rightScore:sc.JP.P }
    ];
    let html = ''; dims.forEach(d => {
        const total = d.leftScore + d.rightScore;
        const leftPct = total===0 ? 50 : d.leftScore/total*100;
        const rightPct = 100-leftPct;
        html += `<div class="dual-bar-item mb-3"><div class="d-flex justify-content-between mb-1"><span>${d.label}</span><span>${d.left} ${d.leftScore} / ${d.right} ${d.rightScore}</span></div><div class="dual-bar"><div class="dual-bar-left" style="width:${leftPct}%">${d.left} ${Math.round(leftPct)}%</div><div class="dual-bar-right" style="width:${rightPct}%">${d.right} ${Math.round(rightPct)}%</div></div></div>`;
    });
    container.innerHTML = html;
}

function createRadarChart(sc) {
    const ctx = document.getElementById('radarChart')?.getContext('2d'); if(!ctx) return;
    const ei = sc.EI.E/(sc.EI.E+sc.EI.I)*100, sn = sc.SN.S/(sc.SN.S+sc.SN.N)*100, tf = sc.TF.T/(sc.TF.T+sc.TF.F)*100, jp = sc.JP.J/(sc.JP.J+sc.JP.P)*100;
    if(window.radarChartInstance) window.radarChartInstance.destroy();
    window.radarChartInstance = new Chart(ctx, { type:'radar', data:{ labels:['外向(E)','感觉(S)','思考(T)','判断(J)','内向(I)','直觉(N)','情感(F)','感知(P)'], datasets:[{ label:'得分', data:[ei,sn,tf,jp,100-ei,100-sn,100-tf,100-jp], backgroundColor:'rgba(52,152,219,0.2)', borderColor:'#3498db', borderWidth:2 }] }, options:{ responsive:true, maintainAspectRatio:false, scales:{ r:{ max:100 } } } });
}

function renderDeepReport(variant) {
    const container = document.getElementById('deepReportContent'); if(!container) return;
    const s = variant.sections; let html = '';
    function addSection(id,title,content){ html += `<section id="${id}" class="report-card"><h3>${title}</h3>${content}</section>`; }
    addSection('letter', s.letter.title, `<div class="letter-content">${s.letter.content.replace(/\n/g,'<br>')}</div>`);
    
    // 新的维度倾向性样式
    let dimHtml = `<p>${s.dimensions.intro}</p>`;
    Object.entries(s.dimensions.data).forEach(([k,v]) => {
        const total = 100; // 百分比值直接就是v.value
        dimHtml += `<div class="dimension-bar">
            <div class="bar-header"><span>${k}</span><span>${v.value}%</span></div>
            <div class="bar-dual">
                <div class="left-fill" style="width:${v.value}%">${v.value}%</div>
                <div class="right-fill" style="width:${100-v.value}%"></div>
            </div>
            <div class="bar-desc">${v.text}</div>
        </div>`;
    });
    dimHtml += `<div class="alert alert-light mt-3">⚠️ ${s.dimensions.swingWarning}</div>`;
    addSection('dimensions','维度倾向性',dimHtml);
    
    const cog = s.cognitiveStack;
    let cogHtml = `<p>${cog.intro}</p><h5>阳面功能</h5><div class="cognitive-grid">`;
    cog.conscious.forEach(f => cogHtml += `<div class="func-card"><div class="func-name">${f.name} (${f.role})</div><div class="func-voice">${f.voice}</div><p>${f.gift}</p></div>`);
    cogHtml += `</div><h5 class="mt-4">阴面功能</h5><div class="cognitive-grid">`;
    cog.shadow.forEach(f => cogHtml += `<div class="func-card"><div class="func-name">${f.name} (${f.role})</div><p>${f.desc}</p></div>`);
    cogHtml += `</div><div class="loop-warning mt-4"><h5>${cog.loopWarning.title}</h5><p><strong>表现：</strong>${cog.loopWarning.lookLike}</p><p><strong>感受：</strong>${cog.loopWarning.feelLike}</p><p><strong>处方：</strong>${cog.loopWarning.prescription}</p></div>`;
    addSection('cognitive','认知功能堆栈',cogHtml);
    
    const rl = s.realLife;
    let rlHtml = `<h5>职场</h5><p><strong>天赋：</strong>${rl.career.talent}</p><p><strong>能量源：</strong>${rl.career.energySource}</p><p><strong>耗竭源：</strong>${rl.career.energyDrain}</p><p><strong>生存建议：</strong>${rl.career.survivalTip}</p>`;
    rlHtml += `<h5 class="mt-3">亲密关系</h5><p><strong>表达：</strong>${rl.relationship.loveExpression}</p><p><strong>接收：</strong>${rl.relationship.loveReception}</p><p><strong>冲突陷阱：</strong>${rl.relationship.conflictTrap}</p><p><strong>翻译器：</strong>${rl.relationship.translator}</p>`;
    rlHtml += `<h5 class="mt-3">学习</h5><p><strong>最佳通道：</strong>${rl.learning.bestChannel}</p><p><strong>拖延归因：</strong>${rl.learning.procrastination}</p><p><strong>解药：</strong>${rl.learning.antidote}</p>`;
    addSection('reallife','现实场景投射',rlHtml);
    
    addSection('subtype','人格亚型',`<h5>${s.subtype.name}</h5><p>${s.subtype.description}</p>`);
    addSection('bodymind','躯体型人格',`<p><strong>压力体征：</strong>${s.bodyMind.stressSigns}</p><p><strong>具身处方：</strong>${s.bodyMind.somaticPrescription}</p>`);
    addSection('environment','环境逆匹配',`<p><strong>伪装人格：</strong>${s.environment.camouflage}</p><p><strong>卸妆仪式：</strong>${s.environment.removalRitual}</p>`);
    
    let para = '<ul>'; s.paradoxes.forEach(p => para += `<li>${p}</li>`); para += '</ul>'; addSection('paradoxes','悖论清单',para);
    let dr = `<p><strong>目的：</strong>${s.devilRitual.purpose}</p><ol>`; s.devilRitual.steps.forEach(step => dr += `<li>${step}</li>`); dr += `</ol><p class="text-warning">${s.devilRitual.warning}</p>`; addSection('devil','魔鬼仪式',dr);
    addSection('metaphor','灵魂气候',`<h5>${s.metaphor.climate}</h5><p>${s.metaphor.description}</p><p><strong>建议：</strong>${s.metaphor.advice}</p>`);
    addSection('closing','尾声',`<p>${s.closing}</p>`);
    
    container.innerHTML = html;
}

function resetTest() { testState = { currentQuestion:0, answers:new Array(200).fill(0), currentDimension:"EI", testCompleted:false, autoJumpTimer:null }; }

function generatePersonalityMatrix() {
    const cont = document.getElementById("personalityMatrix"); if(!cont) return;
    const types = ["ISTJ","ISFJ","INFJ","INTJ","ISTP","ISFP","INFP","INTP","ESTP","ESFP","ENFP","ENTP","ESTJ","ESFJ","ENFJ","ENTJ"];
    // 职业适配数据
    const careerData = {
        ISTJ: "审计、军人、律师、工程师、医生",
        ISFJ: "护理、教师、社工、行政、图书管理",
        INFJ: "心理咨询、教育、写作、公益、人力资源",
        INTJ: "科学家、战略顾问、工程师、律师、教授",
        ISTP: "机械师、飞行员、外科医生、消防员、电工",
        ISFP: "设计师、艺术家、摄影师、花艺师、兽医",
        INFP: "作家、心理咨询师、编辑、教师、艺术家",
        INTP: "程序员、数学家、哲学家、分析师、科学家",
        ESTP: "销售、创业者、运动员、警察、急救人员",
        ESFP: "演员、导游、销售、公关、活动策划",
        ENFP: "记者、广告人、培训师、创业者、咨询师",
        ENTP: "律师、企业家、产品经理、辩论教练、发明家",
        ESTJ: "管理者、军官、法官、金融分析师、校长",
        ESFJ: "教师、护士、客服、行政、社区工作者",
        ENFJ: "教育家、外交官、人力资源总监、教练、演员",
        ENTJ: "CEO、政治家、律师、管理顾问、投资银行家"
    };
    let html = '';
    types.forEach(c => {
        const d = mbtiReports[c];
        const typeName = d?.typeName || '';
        const imgSrc = `images/${c}.png`;
        const description = d?.variants.poetic.sections.dimensions.intro.substring(0, 50) || '';
        const career = careerData[c] || '';
        html += `
        <div class="col-lg-3 col-md-4 col-sm-6">
            <div class="card personality-card-modern h-100 shadow-sm border-0">
                <div class="card-body text-center p-3">
                    <img src="${imgSrc}" alt="${c}" class="type-thumb mb-2" onerror="this.style.display='none'">
                    <h5 class="fw-bold text-primary mb-0">${c}</h5>
                    <small class="text-muted d-block mb-2">${typeName}</small>
                    <p class="small text-secondary mb-2">${description}…</p>
                    <div class="career-tags">
                        ${career.split('、').map(job => `<span class="badge bg-light text-dark me-1 mb-1">${job}</span>`).join('')}
                    </div>
                </div>
            </div>
        </div>`;
    });
    cont.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", init);