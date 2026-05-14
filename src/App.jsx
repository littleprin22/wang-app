import React, { useState, useCallback, useEffect } from 'react';
import { BookOpen, Smile, Sparkles, Download, Copy, RefreshCw, CheckCircle, Edit3, FileText, UserCheck, Award, ChevronRight, Zap, Loader, Trash2 } from 'lucide-react';
import './index.css';
const CORRECT_PASSWORD = '0402';

// 행동발달 특성 태그 목록
const BEHAVIOR_TAGS_UNSORTED = [
  '생활 습관', '지적 호기심', '성실함', '독창성', '도전 정신', '책임감', '교우 관계',
  '운동 능력', '감정 조절', '도덕성', '독립심', '리더십', '예술적 능력', '긍정적 태도',
  '적응력', '규칙 준수', '신중함', '호기심', '공감 능력', '독서 습관', '창의성',
  '계획성', '학습 태도', '자신감', '의사소통 능력', '끈기', '자기 표현력', '갈등 조정',
  '문화 감수성', '환경 의식', '자기 주도성', '협동심', '봉사 정신'
];

const BEHAVIOR_TAGS = BEHAVIOR_TAGS_UNSORTED.sort((a, b) => {
  if (a.length !== b.length) return a.length - b.length;
  return a.localeCompare(b, 'ko');
});

// 창의적 체험활동 - 자율활동 체크리스트
const AUTONOMOUS_ACTIVITY_EVENTS = [
  '학급회의', '학급임원선거', '학급규칙제작', '학급다모임', '1인 1역 정하기', '개학식', '여름방학 돌아보기', '친구 사랑의 날',
  '학교폭력 예방교육', '사이버폭력 예방교육', '언어폭력예방주간활동', '생명존중교육',
  '흡연예방교육', '도박예방교육', '약물오남용 예방교육', '성폭력예방교육', '가정폭력교육', '실종유괴 예방교육',
  '지진대피훈련', '소방훈련', '민방위훈련', '재난안전교육', '교통안전교육', '생존수영교육',
  '인권교육', '양성평등교육', '장애 이해 교육', '다문화교육',
  '통일교육', '독도교육', '환경교육', '정보통신윤리교육', '저작권교육',
  '스마트폰(인터넷) 교육', '감염병예방교육', '에너지절약교육'
];

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState(1);
  const [errorMessage, setErrorMessage] = useState(null);

  // 폭죽 효과를 위한 스크립트 로드 및 상태 관리
  useEffect(() => {
    if (!document.getElementById('confetti-script')) {
      const script = document.createElement('script');
      script.id = 'confetti-script';
      script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const [canFireConfetti, setCanFireConfetti] = useState(true);

  const handleLogoHover = (e) => {
    if (!canFireConfetti || !window.confetti) return;

    const rect = e.target.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    window.confetti({
      particleCount: 80,
      spread: 70,
      origin: { x, y },
      colors: ['#4f46e5', '#10b981', '#f43f5e', '#facc15', '#60a5fa'],
      zIndex: 9999
    });

    setCanFireConfetti(false);
    setTimeout(() => setCanFireConfetti(true), 1500);
  };

  // Vite 환경변수 사용
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; 
  const modelName = 'gemini-1.5-flash';

  const [subjectData, setSubjectData] = useState({
    counts: { '매우잘함': 1, '잘함': 1, '보통': 1, '노력요함': 0 },
    topic: ''
  });
  const [subjectResults, setSubjectResults] = useState([]);

  const [behaviorData, setBehaviorData] = useState({
    personality: '매우우수', learning: '우수', social: '우수', selectedTags: [], customText: '', count: 5
  });
  const [behaviorResults, setBehaviorResults] = useState([]);
  const [combinedBehaviorResult, setCombinedBehaviorResult] = useState('');
  const [isGeneratingBehavior, setIsGeneratingBehavior] = useState(false);

  const [creativeData, setCreativeData] = useState({
    category: '자율활동', count: 5, selectedEvents: [], customInput: ''
  });
  const [creativeResults, setCreativeResults] = useState([]);
  const [isGeneratingCreative, setIsGeneratingCreative] = useState(false);

  const [similarSentenceData, setSimilarSentenceData] = useState({ inputSentence: '', count: 5 });
  const [similarSentenceResults, setSimilarSentenceResults] = useState([]);
  const [isGeneratingSimilar, setIsGeneratingSimilar] = useState(false);

  const [cumulativeData, setCumulativeData] = useState({ inputRecords: '', countPerSentence: 3 });
  const [cumulativeResults, setCumulativeResults] = useState([]);
  const [isGeneratingCumulative, setIsGeneratingCumulative] = useState(false);

  const fetchWithRetry = useCallback(async (url, options, retries = 3, delay = 1000) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response;
    } catch (error) {
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
  }, []);

  const downloadTextAsHWP = (title, content) => {
    const finalContent = Array.isArray(content) ? content.map(item => item.text || item).join('\n\n\n\n') : content;
    const blob = new Blob([finalContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.hwp`; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setErrorMessage({type: 'success', message: `${title}.hwp 파일 다운로드를 시작했습니다. (실제로는 텍스트 파일입니다)`});
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setErrorMessage({type: 'success', message: "클립보드에 복사되었습니다!"});
  };

  const checkSpelling = (text) => {
    let fixed = text.trim();
    fixed = fixed.replace(/\.+$/, '.');
    if (fixed && !fixed.endsWith('.') && !fixed.endsWith('!') && !fixed.endsWith('?')) {
      fixed += '.';
    }
    return fixed;
  };

  const callGeminiAPI = async (userQuery, systemPrompt) => {
    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: { type: "OBJECT", properties: { result: { type: "STRING" }, list: { type: "ARRAY", items: { type: "STRING" } } } }
      }
    };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const response = await fetchWithRetry(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();

    if (result.error) {
      throw new Error(result.error.message || "API 통신 중 오류가 발생했습니다.");
    }

    const candidate = result.candidates?.[0];
    if (!candidate?.content?.parts?.[0]?.text) {
        if (candidate?.finishReason === 'SAFETY') {
             throw new Error("AI 안전 필터에 의해 생성이 차단되었습니다. 입력 내용을 조금 수정해주세요.");
        }
        throw new Error("AI 응답을 받아오지 못했습니다. (빈 응답)");
    }
    
    let jsonText = candidate.content.parts[0].text.trim();
    
    // 복사 버그 방지를 위해 백틱 기호를 변수로 쪼개서 처리합니다.
    const mdMarker = '`' + '`' + '`';
    if (jsonText.startsWith(mdMarker + 'json')) {
      jsonText = jsonText.substring((mdMarker + 'json').length);
    }
    if (jsonText.endsWith(mdMarker)) {
      jsonText = jsonText.substring(0, jsonText.length - mdMarker.length);
    }
    
    return JSON.parse(jsonText.trim());
  };

  const generateSubjectSentences = () => {
    const topicText = subjectData.topic.trim() || "교과 학습 내용";
    const templates = {
      '매우잘함': [
        `${topicText}에 대한 이해도가 매우 뛰어나며 심화된 내용을 설명할 수 있음.`,
        `창의적인 사고로 ${topicText} 관련 문제를 해결하며 타의 모범이 됨.`,
        `수업 시간에 ${topicText}의 핵심 원리를 완벽하게 파악하고 발표함.`,
        `자기주도적으로 ${topicText} 탐구 활동을 수행하여 우수한 성과를 보임.`,
        `동료들과 협력하여 ${topicText}에 대해 깊이 있는 토론을 이끌어냄.`
      ],
      '잘함': [
        `${topicText}을(를) 정확히 이해하고 성실하게 과제를 수행함.`,
        `성실한 학습 태도로 ${topicText}의 주요 개념을 잘 파악하고 있음.`,
        `다양한 자료를 활용하여 ${topicText} 관련 활동에 적극적으로 참여함.`,
        `${topicText}에 흥미를 가지고 있으며 자신의 생각을 조리 있게 표현함.`,
        `배운 내용을 바탕으로 ${topicText} 응용 문제를 원활하게 해결함.`
      ],
      '보통': [
        `${topicText}의 기본적인 내용을 이해하고 있으며 수업에 성실히 참여함.`,
        `주어진 시간 내에 ${topicText} 관련 과제를 무난하게 수행함.`,
        `꾸준한 노력으로 ${topicText}에 대한 흥미를 유지하고 있음.`,
        `${topicText}의 기초 개념을 알고 있으나 응용력 배양이 필요함.`,
        `모둠 활동에서 ${topicText} 학습에 참여하며 협력하는 태도를 보임.`
      ],
      '노력요함': [
        `${topicText}의 기초 개념 이해에 다소 어려움을 겪고 있어 보충 지도가 필요함.`,
        `교사의 격려를 통해 ${topicText} 학습에 대한 자신감을 가질 필요가 있음.`,
        `과제 수행 시 ${topicText} 관련하여 교사나 친구의 도움이 필요함.`,
        `지속적인 복습을 통해 ${topicText}의 기본적인 내용을 익혀야 함.`,
        `${topicText} 수업 집중력을 높이고 기초 학습 능력을 기르도록 노력해야 함.`
      ]
    };

    let newResults = [];
    let idCounter = 0;
    Object.entries(subjectData.counts).forEach(([level, count]) => {
      const levelTemplates = templates[level];
      for (let i = 0; i < count; i++) {
        newResults.push({ id: idCounter++, level, text: levelTemplates[i % levelTemplates.length] });
      }
    });
    setSubjectResults(newResults);
  };

  const handleBehaviorTagToggle = (tag) => {
    setBehaviorData(prev => {
      const isSelected = prev.selectedTags.includes(tag);
      const newTags = isSelected ? prev.selectedTags.filter(t => t !== tag) : [...prev.selectedTags, tag];
      return { ...prev, selectedTags: newTags };
    });
  };

  const generateBehaviorSentences = async () => {
    setIsGeneratingBehavior(true);
    setErrorMessage(null);
    try {
      const { personality, learning, social, selectedTags, customText, count } = behaviorData;
      let customInfo = '';
      if (selectedTags.length > 0) customInfo += `강조할 학생 특성(선택된 태그): ${selectedTags.join(', ')}. `;
      if (customText.trim()) customInfo += `추가 특이사항: ${customText.trim()}`;
      const finalCustomText = customInfo || '없음';

      const systemPrompt = "당신은 초등학교 교사입니다. 학생의 특성(인성, 학습, 교우관계)과 특이사항을 바탕으로 생활기록부 행동특성 및 종합의견을 작성하세요. 입력된 특이사항을 자연스럽게 문장 속에 녹여내어 하나의 완성된 문단에 들어갈 독립적인 문장들을 만드세요. 각 문장은 독립적이며 '~함', '~임' 등의 명사형 종결어미를 사용하세요. 결과는 JSON 객체 { 'list': ['문장1', '문장2', ...] } 형태로 반환하세요.";
      const userQuery = `인성: ${personality}\n학습: ${learning}\n교우관계: ${social}\n특이사항(반드시 자연스럽게 변환하여 포함할 것): "${finalCustomText}"\n생성할 문장 개수: ${count}개`;

      const response = await callGeminiAPI(userQuery, systemPrompt);
      if (response && response.list && Array.isArray(response.list)) {
        const sentences = response.list.map((text, index) => ({ 
          id: Date.now() + index, text: checkSpelling(text), isLoading: false 
        }));
        setBehaviorResults(sentences);
        setCombinedBehaviorResult(sentences.map(s => s.text).join(' '));
        setActiveTab(4);
      } else throw new Error("AI 응답 형식이 올바르지 않습니다.");
    } catch (error) {
      setErrorMessage({type: 'error', message: error.message || "AI 문장 생성 중 오류가 발생했습니다."});
    } finally {
      setIsGeneratingBehavior(false);
    }
  };

  const handleBehaviorSentenceRefresh = async (sentenceId, oldText) => {
    setErrorMessage(null);
    setBehaviorResults(prev => prev.map(s => s.id === sentenceId ? { ...s, isLoading: true } : s));
    try {
      const systemPrompt = "당신은 생활기록부 문장 전문가입니다. 입력된 문장의 의미를 유지하되, 어휘와 구조를 다양하게 변형하여 하나의 새로운 문장으로 작성하세요. 문장은 '~함.', '~임.' 등 명사형 종결어미로 끝나야 합니다. 결과는 JSON 객체 { 'result': '새로운 문장' } 형태로 반환하세요.";
      const userQuery = `원본 문장: "${oldText}"\n새롭게 변환할 것. 반드시 '~함.', '~임.' 등으로 끝나게 해주세요.`;
      const response = await callGeminiAPI(userQuery, systemPrompt);
      if (response && response.result) {
        const newText = checkSpelling(response.result);
        setBehaviorResults(prev => {
          const newResults = prev.map(s => s.id === sentenceId ? { ...s, text: newText, isLoading: false } : s);
          setCombinedBehaviorResult(newResults.map(s => s.text).join(' '));
          return newResults;
        });
      } else throw new Error("AI 응답 형식이 올바르지 않습니다.");
    } catch (error) {
      setBehaviorResults(prev => prev.map(s => s.id === sentenceId ? { ...s, isLoading: false } : s));
      setErrorMessage({type: 'error', message: "문장 변환 중 오류가 발생했습니다."});
    }
  };

  const handleDeleteBehaviorSentence = useCallback((sentenceId) => {
    setBehaviorResults(prev => {
      const newResults = prev.filter(s => s.id !== sentenceId);
      setCombinedBehaviorResult(newResults.map(s => s.text).join(' '));
      return newResults;
    });
  }, []);

  const combineBehaviorSentences = useCallback(() => {
    setCombinedBehaviorResult(behaviorResults.map(s => s.text).join(' '));
  }, [behaviorResults]);

  const generateCreativeSentences = async () => {
    const { category, count, selectedEvents, customInput } = creativeData;
    setIsGeneratingCreative(true);
    setErrorMessage(null);
    try {
      let activityDetails = customInput.trim();
      if (category === '자율활동') {
        const eventsList = selectedEvents.join(', ');
        if (eventsList || activityDetails) {
          activityDetails = `${eventsList ? `실시한 활동 목록: ${eventsList}. ` : ''}${activityDetails ? `추가 특이사항: ${activityDetails}` : ''}`;
        } else {
          setErrorMessage({type: 'error', message: "활동 내용이나 체크된 항목을 하나 이상 입력/선택해주세요."});
          setIsGeneratingCreative(false);
          return;
        }
      } else if (!activityDetails) {
        setErrorMessage({type: 'error', message: "활동 내용을 입력해주세요."});
        setIsGeneratingCreative(false);
        return;
      }

      const systemPrompt = `당신은 초등학교 교사입니다. 사용자가 입력한 ${category} 활동 내용을 바탕으로, 생활기록부 창의적 체험활동 특기사항에 들어갈 문장들을 작성하세요. 활동 내용을 그대로 쓰지 말고, 구체적인 활동 모습, 배우고 느낀 점, 성장한 점 등을 덧붙여 교육적으로 의미 있는 문장으로 변환하세요. 다른 활동에 대한 언급은 일절 포함하지 마세요. 문장은 '~함', '~임' 등의 명사형 종결어미를 사용하세요. 결과는 JSON 객체 { 'list': ['문장1', '문장2', ...] } 형태로 반환하세요.`;
      const userQuery = `활동 영역: ${category}\n사용자 입력 내용(자연스럽게 변환할 것): "${activityDetails}"\n생성할 문장 개수: ${count}개`;

      const response = await callGeminiAPI(userQuery, systemPrompt);
      if (response && response.list && Array.isArray(response.list)) {
        const results = response.list.map((text, index) => ({ id: Date.now() + index, text: checkSpelling(text), isLoading: false }));
        setCreativeResults(results);
        setActiveTab(6);
      } else throw new Error("AI 응답 형식이 올바르지 않습니다.");
    } catch (error) {
      setErrorMessage({type: 'error', message: `오류: ${error.message || "AI 문장 생성 중 문제가 발생했습니다."}`});
    } finally {
      setIsGeneratingCreative(false);
    }
  };

  const handleCreativeSentenceRefresh = async (sentenceId, oldText) => {
    setErrorMessage(null);
    setCreativeResults(prev => prev.map(s => s.id === sentenceId ? { ...s, isLoading: true } : s));
    try {
      const systemPrompt = "당신은 생활기록부 창의적 체험활동 문장 전문가입니다. 입력된 문장의 활동 내용과 의미를 유지하되, 어휘와 구조를 다양하게 변형하여 하나의 새로운 문장으로 작성하세요. 문장은 '~함.', '~임.' 등 명사형 종결어미로 끝나야 합니다. 결과는 JSON 객체 { 'result': '새로운 문장' } 형태로 반환하세요.";
      const userQuery = `원본 창의체험 문장: "${oldText}"\n새롭게 변환할 것. 반드시 '~함.', '~임.' 등으로 끝나게 해주세요.`;
      const response = await callGeminiAPI(userQuery, systemPrompt);
      if (response && response.result) {
        setCreativeResults(prev => prev.map(s => s.id === sentenceId ? { ...s, text: checkSpelling(response.result), isLoading: false } : s));
      } else throw new Error("AI 응답 형식이 올바르지 않습니다.");
    } catch (error) {
      setCreativeResults(prev => prev.map(s => s.id === sentenceId ? { ...s, isLoading: false } : s));
      setErrorMessage({type: 'error', message: "문장 변환 중 오류가 발생했습니다."});
    }
  };

  const generateSimilarSentences = async () => {
    const { inputSentence, count } = similarSentenceData;
    if (!inputSentence.trim()) return setErrorMessage({type: 'error', message: "원본 문장을 입력해 주세요."});
    setIsGeneratingSimilar(true);
    setErrorMessage(null); 
    try {
      const systemPrompt = "당신은 생활기록부 문장 전문가입니다. 입력된 문장의 의미를 유지하되, 어휘와 구조를 다양하게 변형하여 요청한 개수만큼 생성하세요. 모든 문장은 '~함.', '~임.' 등 명사형 종결어미로 끝나야 합니다. 결과는 JSON 객체 { 'list': ['문장1', '문장2', ...] } 형태로 반환하세요.";
      const userQuery = `원본 문장: "${inputSentence}"\n생성 개수: ${count}개\n반드시 '~함.', '~임.' 등으로 끝나게 해주세요.`;
      const response = await callGeminiAPI(userQuery, systemPrompt);
      if (response && response.list && Array.isArray(response.list)) {
        setSimilarSentenceResults(response.list.map((text, idx) => ({ id: idx, text: checkSpelling(text) })));
      } else throw new Error("AI 응답 형식이 올바르지 않습니다.");
    } catch (error) {
      setErrorMessage({type: 'error', message: `문장 생성 실패: ${error.message}`});
    } finally {
      setIsGeneratingSimilar(false);
    }
  };

  const generateCumulativeRecords = async () => {
    const { inputRecords, countPerSentence } = cumulativeData;
    if (!inputRecords.trim()) return setErrorMessage({type: 'error', message: "누가기록할 원본 문장을 입력해 주세요."});
    setIsGeneratingCumulative(true);
    setErrorMessage(null); 
    try {
      const systemPrompt = `당신은 초등학교 교사의 누가기록(행동발달 세부사항) 작성을 돕는 전문가입니다. 입력된 학생의 긴 문장들을 분석하여, 각 문장별로 세부적이고 간단한 사실 기록 문장으로 분해하여 작성하세요. 각 세부 문장은 짧고 명료하며, 반드시 '~함', '~임', '.' 등의 명사형 종결어미로 끝내야 합니다. 문장들은 교육적 의미를 담고 학생의 구체적인 행동 사실을 중심으로 작성되어야 합니다. 결과는 JSON 객체 { 'list': ['세부 문장 1', '세부 문장 2', ...] } 형태로 반환하세요.`;
      const userQuery = `원본 누가기록 문장들: "${inputRecords}"\n각 문장당 생성할 세부 문장의 최소 개수: ${countPerSentence}개`;
      const response = await callGeminiAPI(userQuery, systemPrompt);
      if (response && response.list && Array.isArray(response.list)) {
        setCumulativeResults(response.list.map((text, idx) => ({ id: Date.now() + idx, text: checkSpelling(text) })));
      } else throw new Error("AI 응답 형식이 올바르지 않습니다.");
    } catch (error) {
      setErrorMessage({type: 'error', message: `누가기록 생성 실패: ${error.message}`});
    } finally {
      setIsGeneratingCumulative(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      setErrorMessage({type: 'success', message: '비밀번호 확인 완료! 어서 들어오세요.'});
    } else {
      setErrorMessage({type: 'error', message: '비밀번호가 틀렸어요. 다시 확인해 주세요.'});
      setPasswordInput('');
    }
  };

  const TabButton = ({ id, label, icon: Icon, color }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-3 text-sm font-bold transition-all duration-200 border-b-2 whitespace-nowrap ${
        activeTab === id ? `border-${color}-500 text-${color}-600 bg-${color}-50` : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon size={18}/>
      <span>{label}</span>
    </button>
  );

  const MessageToast = () => {
    if (!errorMessage) return null;
    const isError = errorMessage.type === 'error';
    return (
      <div className={`fixed bottom-5 right-5 ${isError ? 'bg-red-500' : 'bg-emerald-500'} text-white p-4 rounded-xl shadow-xl flex items-center space-x-3 z-50 animate-fadeIn`}>
        <span>{errorMessage.message}</span>
        <button onClick={() => setErrorMessage(null)} className="ml-2 opacity-70 hover:opacity-100">&times;</button>
      </div>
    );
  };

  const calculateRows = (text) => Math.max(1, Math.ceil((text || '').length / 50));

  const LoginScreen = () => (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
            
            <div className="w-24 h-24 mx-auto mb-4 overflow-hidden rounded-full border-2 border-indigo-100">
              <img
                src="https://i.ibb.co/RGGK87Pf/image.jpg"
                alt="왕곡초 로고"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">선생님 인증</h2>
            <p className="text-slate-500 text-sm">소중한 학생 정보를 위해 비밀번호를 입력해주세요.</p>
          </div>
        <input 
          type="password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500" 
          autoFocus
        />
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition duration-200"
          disabled={passwordInput.length === 0}
        >
          접속하기
        </button>
      </form>
    </div>
  );

  const BehaviorTagSection = () => (
    <div className="space-y-4 bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-emerald-800 flex items-center"><Sparkles size={18} className="mr-2"/>강조할 학생 특성 선택</h3>
        <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">클릭하여 선택/해제</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {BEHAVIOR_TAGS.map(tag => {
          const isSelected = behaviorData.selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => handleBehaviorTagToggle(tag)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors duration-200 ${
                isSelected ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-emerald-100 border border-slate-200'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
      <div className="text-sm text-slate-600 mt-2">
        선택된 특성: <span className="font-bold text-emerald-700">{behaviorData.selectedTags.join(', ') || '없음'}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <MessageToast/>
      {!isAuthenticated ? (
        <LoginScreen/>
      ) : (
        <>
          <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                  <img 
                    src="https://i.ibb.co/Q77V0XnL/logo.jpg" 
                    alt="왕곡초 로고" 
                    className="w-16 h-16 object-contain drop-shadow-md rounded-full bg-white transition-all duration-300 hover:scale-110 hover:-rotate-12 hover:drop-shadow-2xl hover:ring-4 hover:ring-indigo-200 cursor-pointer"
                    onMouseEnter={handleLogoHover}
                    onClick={handleLogoHover}
                    onError={(e) => { 
                      e.target.onerror = null; 
                      e.target.outerHTML = '<span style="font-size: 2rem;">🏫</span>';
                    }}
                  />
                  왕곡초 성적처리기💖 
                  <span className="text-indigo-500 text-sm font-medium ml-2">v2.5 AI Edition</span>
                </h1>
              </div>
              <div className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">선생님을 위한 스마트한 도우미</div>
            </div>
            <div className="max-w-7xl mx-auto px-6 mt-2 flex overflow-x-auto no-scrollbar">
              <TabButton id={1} label="교과평가 설정" icon={BookOpen} color="indigo"/>
              <TabButton id={2} label="교과 결과" icon={FileText} color="indigo"/>
              <TabButton id={3} label="행동발달 설정" icon={UserCheck} color="emerald"/>
              <TabButton id={4} label="행동발달 결과" icon={Smile} color="emerald"/>
              <TabButton id={5} label="창의체험 설정" icon={Sparkles} color="rose"/>
              <TabButton id={6} label="창의체험 결과" icon={CheckCircle} color="rose"/>
              <TabButton id={7} label="비슷한 문장 변환기" icon={Zap} color="yellow"/> 
              <TabButton id={8} label="누가기록 생성기" icon={Edit3} color="purple"/>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-6 py-8">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 min-h-[600px] p-8">
              
              
              {(activeTab === 1 || activeTab === 2) && (
                <div className="space-y-8 animate-fadeIn">
                  {activeTab === 1 ? (
                    <>
                      <div className="text-center space-y-2 mb-8"><h2 className="text-2xl font-bold text-indigo-900">교과평가 설정 📚</h2></div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-700">평가 내용 / 성취 기준</label>
                            <textarea className="w-full h-48 p-5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none" value={subjectData.topic} onChange={(e) => setSubjectData({...subjectData, topic: e.target.value})} placeholder="예: 분수의 덧셈과 뺄셈..."/>
                        </div>
                        <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            {['매우잘함', '잘함', '보통', '노력요함'].map(lvl => (
                                <div key={lvl} className="flex items-center space-x-4">
                                    <span className="w-20 font-bold text-sm">{lvl}</span>
                                    <input type="range" min="0" max="20" value={subjectData.counts[lvl]} onChange={(e) => setSubjectData({...subjectData, counts: {...subjectData.counts, [lvl]: parseInt(e.target.value)}})} className="flex-grow h-2 rounded-lg accent-indigo-600"/>
                                    <span className="font-bold w-8 text-right">{subjectData.counts[lvl]}</span>
                                </div>
                            ))}
                        </div>
                      </div>
                      <div className="flex justify-end pt-8"><button onClick={() => { generateSubjectSentences(); setActiveTab(2); }} className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg flex items-center space-x-2"><span>평가 문장 생성하기</span><ChevronRight size={20}/></button></div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-end border-b pb-4 border-slate-100"><h2 className="text-2xl font-bold text-indigo-900">교과평가 결과 📝</h2><button onClick={() => downloadTextAsHWP('교과평가', subjectResults)} className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Download size={16}/> hwp 저장</button></div>
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">{subjectResults.map(r => <div key={r.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200"><p>{r.text}</p></div>)}</div>
                    </>
                  )}
                </div>
              )}

              
              {activeTab === 3 && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="text-center space-y-2 mb-8">
                    <h2 className="text-2xl font-bold text-emerald-900">행동발달 특성 설정 🌱</h2>
                    <p className="text-slate-500">AI가 선택한 특성과 특이사항을 분석하여 자연스러운 생활기록부 문장을 만들어줍니다.</p>
                  </div>
                  
                  <BehaviorTagSection/> 
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[{k:'personality',l:'인성'},{k:'learning',l:'학습'},{k:'social',l:'교우관계'}].map(o=>(
                      <div key={o.k} className="space-y-3">
                        <label className="block text-sm font-bold text-slate-700 text-center">{o.l}</label>
                        <select value={behaviorData[o.k]} onChange={(e)=>setBehaviorData({...behaviorData,[o.k]:e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"><option>매우우수</option><option>우수</option><option>보통</option><option>노력요함</option><option>지도필요</option></select>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">전체 길이 (문장 수)</label>
                    <div className="flex items-center space-x-4">
                      <input type="range" min="3" max="25" value={behaviorData.count} onChange={(e)=>setBehaviorData({...behaviorData,count:parseInt(e.target.value)})} className="flex-grow h-2 rounded-lg accent-emerald-600"/>
                      <span className="font-bold text-emerald-600">{behaviorData.count}개</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">추가 특이사항 (AI가 자연스럽게 변환합니다 ✨)</label>
                    <textarea className="w-full h-32 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 resize-none" placeholder="예: 친구가 어려워할 때 먼저 다가가서 도와줌 / 발표할 때 목소리가 조금 작음" value={behaviorData.customText} onChange={(e)=>setBehaviorData({...behaviorData,customText:e.target.value})}/>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button onClick={generateBehaviorSentences} disabled={isGeneratingBehavior} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center space-x-2 disabled:opacity-50">
                      {isGeneratingBehavior ? <Loader size={18} className="animate-spin"/> : <Sparkles size={18}/>}<span>AI 문구 생성</span>
                    </button>
                  </div>
                </div>
              )}

              
              {activeTab === 4 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-end border-b pb-4 border-slate-100">
                    <h2 className="text-2xl font-bold text-emerald-900">행동발달 결과 📋</h2>
                    <button onClick={() => downloadTextAsHWP('행동발달_종합의견', combinedBehaviorResult || behaviorResults)} className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Download size={16}/> hwp 저장</button>
                  </div>
                  
                  <p className="text-slate-600 text-sm">개별 문장을 수정하거나 옆의 새로고침/삭제 버튼으로 관리할 수 있습니다.</p>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      {behaviorResults.length > 0 ? behaviorResults.map(r => (
                          <div key={r.id} className="flex items-start space-x-2 p-3 bg-white rounded-xl shadow-sm border border-emerald-200">
                              <textarea 
                                value={r.text} 
                                onChange={(e) => setBehaviorResults(prev => prev.map(s => s.id === r.id ? { ...s, text: e.target.value } : s))}
                                onBlur={combineBehaviorSentences}
                                className="flex-grow w-full border-none resize-none text-sm leading-6 focus:ring-0"
                                rows={calculateRows(r.text)}
                              />
                              <button onClick={() => handleBehaviorSentenceRefresh(r.id, r.text)} disabled={r.isLoading} className="p-1.5 rounded-full text-emerald-500 hover:bg-emerald-100 disabled:opacity-50" title="이 문장만 다시 생성">
                                {r.isLoading ? <Loader size={18} className="animate-spin"/> : <RefreshCw size={18}/>}
                              </button>
                              <button onClick={() => handleCopy(r.text)} className="p-1.5 rounded-full text-slate-400 hover:text-emerald-500" title="복사"><Copy size={18}/></button>
                              <button onClick={() => handleDeleteBehaviorSentence(r.id)} className="p-1.5 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50" title="삭제"><Trash2 size={18}/></button>
                          </div>
                      )) : <p className="text-center text-slate-400 py-10">설정 탭에서 문장을 생성해 주세요.</p>}
                  </div>

                  <div className="flex justify-end">
                    <button onClick={combineBehaviorSentences} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-md flex items-center space-x-2">
                        <CheckCircle size={18}/><span>한 문단으로 합치기</span>
                    </button>
                  </div>

                  <h3 className="text-xl font-bold text-slate-700 mt-4 flex items-center space-x-2"><ChevronRight size={20}/> 종합 의견 (한 문단)</h3>
                  <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200">
                      <textarea 
                        value={combinedBehaviorResult} 
                        onChange={(e) => setCombinedBehaviorResult(e.target.value)}
                        className="w-full bg-transparent border-none text-slate-800 leading-7 text-base resize-none h-[150px] focus:ring-0"
                        placeholder="여기에 합쳐진 문장이 표시됩니다."
                      />
                      <div className="flex justify-end mt-2 space-x-4">
                          <button onClick={()=>handleCopy(combinedBehaviorResult)} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold shadow-lg">전체 복사</button>
                          <button onClick={()=>setActiveTab(3)} className="px-4 py-2 rounded-lg font-bold border-2 border-slate-300 text-slate-600">다시 설정</button>
                      </div>
                  </div>
                </div>
              )}

              
              {activeTab === 5 && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="text-center space-y-2 mb-6"><h2 className="text-2xl font-bold text-rose-900">창의적 체험활동 설정 🎨</h2></div>
                  <div className="flex space-x-4 border-b border-slate-200 pb-4 overflow-x-auto">
                    {['자율활동', '동아리활동', '봉사활동', '진로활동'].map(cat => (
                      <button key={cat} onClick={() => setCreativeData({...creativeData, category: cat})} className={`px-4 py-2 rounded-full font-bold whitespace-nowrap ${creativeData.category === cat ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{cat}</button>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">생성할 문장 수: {creativeData.count}개</label>
                    <input type="range" min="3" max="20" value={creativeData.count} onChange={(e)=>setCreativeData({...creativeData,count:parseInt(e.target.value)})} className="w-full h-2 rounded-lg accent-rose-600"/>
                  </div>
                  
                  {creativeData.category === '자율활동' ? (
                    <>
                      <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 space-y-4">
                        <h3 className="font-bold text-rose-800">필수 교육 및 활동 목록 (체크박스)</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {AUTONOMOUS_ACTIVITY_EVENTS.map(evt => (
                              <label key={evt} className="flex items-center space-x-2 text-sm font-medium text-slate-700">
                                <input 
                                  type="checkbox" 
                                  checked={creativeData.selectedEvents.includes(evt)} 
                                  onChange={(e)=>{
                                    const s=e.target.checked?[...creativeData.selectedEvents,evt]:creativeData.selectedEvents.filter(x=>x!==evt);
                                    setCreativeData({...creativeData,selectedEvents:s})
                                  }} 
                                  className="rounded text-rose-500 border-rose-300 focus:ring-rose-500"
                                />
                                <span>{evt}</span>
                              </label>
                            ))}
                        </div>
                      </div>
                      <div className="space-y-4 bg-rose-50 p-6 rounded-2xl border border-rose-100">
                          <h3 className="font-bold text-rose-800 flex items-center"><Edit3 size={18} className="mr-2"/>추가 특이사항 (AI 변환 ✨)</h3>
                          <textarea 
                              className="w-full h-32 p-4 border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 resize-none" 
                              placeholder="예: 학급 회의에서 안건을 주도적으로 발의함" 
                              value={creativeData.customInput} 
                              onChange={(e)=>setCreativeData({...creativeData, customInput:e.target.value})}
                          />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4 bg-rose-50 p-6 rounded-2xl border border-rose-100">
                        <h3 className="font-bold text-rose-800 flex items-center"><Edit3 size={18} className="mr-2"/>활동 내용 입력 (AI 변환 ✨)</h3>
                        <textarea 
                          className="w-full h-32 p-4 border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 resize-none" 
                          placeholder="구체적인 활동 내용을 입력해주세요." 
                          value={creativeData.customInput} 
                          onChange={(e)=>setCreativeData({...creativeData, customInput:e.target.value})}
                        />
                    </div>
                  )}

                  <div className="flex justify-end pt-4"><button onClick={generateCreativeSentences} disabled={isGeneratingCreative} className="bg-rose-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center space-x-2 disabled:opacity-50">{isGeneratingCreative ? <Loader size={18} className="animate-spin"/> : <Sparkles size={18}/>}<span>AI 문구 생성</span></button></div>
                </div>
              )}

              
              {activeTab === 6 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-end border-b pb-4 border-slate-100">
                    <h2 className="text-2xl font-bold text-rose-900">창의적 체험활동 결과 🏆</h2>
                    <button onClick={() => downloadTextAsHWP('창의체험', creativeResults)} className="bg-rose-100 text-rose-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Download size={16}/> hwp 저장</button>
                  </div>
                  
                  <p className="text-slate-600 text-sm">개별 문장을 수정하거나 옆의 새로고침 버튼으로 다시 작성 요청할 수 있습니다.</p>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 bg-rose-50 p-4 rounded-2xl border border-rose-100">
                        {creativeResults.length > 0 ? creativeResults.map(r => (
                            <div key={r.id} className="flex items-start space-x-2 p-3 bg-white rounded-xl shadow-sm border border-rose-200">
                                <textarea 
                                    value={r.text} 
                                    onChange={(e) => setCreativeResults(prev => prev.map(s => s.id === r.id ? { ...s, text: e.target.value } : s))}
                                    className="flex-grow w-full border-none resize-none text-sm leading-6 focus:ring-0"
                                    rows={calculateRows(r.text)}
                                />
                                <button onClick={() => handleCreativeSentenceRefresh(r.id, r.text)} disabled={r.isLoading} className="p-1.5 rounded-full text-rose-500 hover:bg-rose-100 disabled:opacity-50">
                                    {r.isLoading ? <Loader size={18} className="animate-spin"/> : <RefreshCw size={18}/>}
                                </button>
                                <button onClick={() => handleCopy(r.text)} className="p-1.5 rounded-full text-slate-400 hover:text-rose-500"><Copy size={18}/></button>
                            </div>
                        )) : <p className="text-center text-slate-400 py-10">설정 탭에서 문장을 생성해 주세요.</p>}
                  </div>
                  <div className="flex justify-center pt-4">
                    <button onClick={()=>handleCopy(creativeResults.map(r=>r.text).join('\n'))} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg">전체 결과 복사</button>
                  </div>
                </div>
              )}

              
              {activeTab === 7 && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="text-center space-y-2 mb-8"><h2 className="text-2xl font-bold text-yellow-800">비슷한 문장 변환기 ✨</h2></div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <textarea className="w-full h-32 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-yellow-500 resize-none" placeholder="변환하고 싶은 원본 문장을 입력하세요." value={similarSentenceData.inputSentence} onChange={(e)=>setSimilarSentenceData({...similarSentenceData, inputSentence:e.target.value})}/>
                        <div className="flex items-center space-x-4">
                            <input type="range" min="1" max="50" value={similarSentenceData.count} onChange={(e)=>setSimilarSentenceData({...similarSentenceData,count:parseInt(e.target.value)})} className="flex-grow h-2 rounded-lg accent-yellow-600"/>
                            <span className="font-bold text-yellow-600">{similarSentenceData.count}개</span>
                        </div>
                        <button onClick={generateSimilarSentences} disabled={isGeneratingSimilar} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg flex justify-center items-center space-x-2 disabled:opacity-50">{isGeneratingSimilar ? <Loader size={18} className="animate-spin"/> : <Zap size={18}/>}<span>생성 시작</span></button>
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        {similarSentenceResults.length===0 && !isGeneratingSimilar && <p className="text-center text-slate-400">결과가 여기에 표시됩니다.</p>}
                        {similarSentenceResults.map(r=><div key={r.id} className="p-3 bg-white rounded-lg shadow-sm border border-slate-100 flex"><p className="flex-grow text-sm">{r.text}</p><button onClick={()=>handleCopy(r.text)} className="ml-2 text-yellow-600"><Copy size={14}/></button></div>)}
                    </div>
                  </div>
                </div>
              )}
              
              
              {activeTab === 8 && (
                <div className="space-y-8 animate-fadeIn">
                    <div className="text-center space-y-2 mb-8">
                        <h2 className="text-2xl font-bold text-purple-800">누가기록 생성기 ✏️</h2>
                        <p className="text-slate-500">긴 문장으로 기록된 내용을 구체적이고 간결한 세부 기록 문장으로 분해하여 변환합니다.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">원본 누가기록 문장</label>
                                <textarea 
                                    className="w-full h-48 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 resize-none" 
                                    placeholder="예: 과학 시간에 실험을 성실히 수행하여 좋은 결과를 얻음." 
                                    value={cumulativeData.inputRecords} 
                                    onChange={(e)=>setCumulativeData({...cumulativeData, inputRecords:e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">각 원본 문장당 생성할 세부 문장의 최소 개수: {cumulativeData.countPerSentence}개</label>
                                <input 
                                    type="range" min="1" max="5" value={cumulativeData.countPerSentence} 
                                    onChange={(e)=>setCumulativeData({...cumulativeData,countPerSentence:parseInt(e.target.value)})} 
                                    className="w-full h-2 rounded-lg accent-purple-600"
                                />
                            </div>
                            <button onClick={generateCumulativeRecords} disabled={isGeneratingCumulative} className="w-full bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-xl font-bold shadow-lg flex justify-center items-center space-x-2 disabled:opacity-50">
                                {isGeneratingCumulative ? <Loader size={18} className="animate-spin"/> : <Edit3 size={18}/>}<span>누가기록 분해 및 생성</span>
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-slate-700 mt-4">세부 기록 결과 (간결한 문장들)</h3>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 bg-purple-50 p-6 rounded-2xl border border-purple-100">
                                {cumulativeResults.length === 0 && !isGeneratingCumulative ? (
                                    <p className="text-center text-slate-400 py-10">생성 버튼을 눌러 누가기록을 분해하세요.</p>
                                ) : (
                                    cumulativeResults.map((r, index) => (
                                        <div key={r.id} className="p-3 bg-white rounded-lg shadow-sm border border-purple-200 flex items-start space-x-2">
                                            <span className="text-sm font-bold text-purple-600 w-4 flex-shrink-0">{index + 1}.</span>
                                            <p className="flex-grow text-sm leading-6">{r.text}</p>
                                            <button onClick={()=>handleCopy(r.text)} className="ml-2 p-1 text-purple-600 hover:bg-purple-100 rounded-full" title="문장 복사"><Copy size={14}/></button>
                                        </div>
                                    ))
                                )}
                            </div>
                            {cumulativeResults.length > 0 && (
                                <div className="flex justify-end">
                                    <button onClick={()=>handleCopy(cumulativeResults.map(r=>r.text).join('\n'))} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold shadow-lg">전체 결과 복사</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
              )}

            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default App;