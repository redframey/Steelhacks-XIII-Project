
const customers = [
  {
    name: "Charlie",
    image: "assets/cus1_happy.png",
    incorrectImage: "assets/cus2_sad.png",
    question: "Are you ready to start your Sweet adventure?",
    answers: ["Yes!"],
    correctAnswer: 0,
    reward: 0,
    explanation: "Then Lets Go!",
    incorrectExplanation: "You shouldn't be seeing this",
    correctResponse: "Awesome!",
    incorrectResponse: "Something bad happened if you are reading this"
  },
  {
  name: "Bart",
  image: "assets/cus2_happy.png", 
  incorrectImage: "assets/cus2_sad.png", 
  question: "What is a Goal", 
  answers: ["Profit","Something Someone gives to you", "Something you set out to achieve","Something you buy"] ,
  correctAnswer: 2, 
  reward: 3, 
  explanation: "Correct! A goal is something you set out to achieve.", 
  incorrectExplanation: "Incorrect, a goal is something you set out to achieve", 
  correctResponse: "Thanks!", 
  incorrectResponse: "I'll come back later I guess...",
  },
  {
  name: "Dumb",
  image: "assets/cus5_happy.png", 
  incorrectImage: "assets/cus5_sad.png", 
  question: "Keeping your spare change in a piggy bank after every allowance is an example of what? ", 
  answers: ["Piggy Bank","Checkings","Profit","Savings"] ,
  correctAnswer: 3, 
  reward: 3, 
  explanation: "Correct! That would be an example of savings", 
  incorrectExplanation: "Incorrect, this is an example of savings", 
  correctResponse: "Yummm", 
  incorrectResponse: "I'm Going to The Ice Cream Shack then...",
  },
  {
  name: "Dumber",
  image: "assets/cus3_happy.png", 
  incorrectImage: "assets/cus3_sad.png", 
  question: "If you sell lemonade for $3 and it costs $2 of ingredients per drink then you've made a ", 
  answers: ["Profit","Mistake","Loss","Savings"] ,
  correctAnswer: 0, 
  reward: 3, 
  explanation: "Correct! That would be an example of profit", 
  incorrectExplanation: "Incorrect, this is an example of profit", 
  correctResponse: "Mmmm", 
  incorrectResponse: "Im rating you a 0/10 on yelp"
  }
];


const dialogueEvents = [
  {
    question: 1,
    dialogue: "The Goal Of this Game is to Sell as much Lemonade as possible until you reach your Goal! Earn money by answering questions about finance; each question is different and catered to your current knowledge. You will earn more money per question the further you are. After every several questions or so A dialogue will appear to teach you the next term, you’ll need for future questions. Have Fun and Good Luck! "
  },
];


const CUSTOMER_INTRO_MS = 1500;

const CUSTOMER_RESPONSE_MS = 3000;


const SAVE_KEY = "learn-with-lemonade-save";
let game = null;


const SOUND_ENABLED_AT_START = true;
const MUSIC_VOLUME = 0.16;
const MUSIC_NOTES = [196, 247, 294, 247, 220, 262, 330, 262];
const MUSIC_SPEED_MS = 2400;      
const MUSIC_NOTE_VOLUME = 0.035;   
const MUSIC_NOTE_LENGTH = 1.8;     
const MUSIC_SOUND_TYPE = "sine";  

const CLICK_SOUND_FREQUENCY = 330;
const ANSWER_SOUND_FREQUENCY = 660;
const NEXT_SOUND_FREQUENCY = 520;
const UI_SOUND_VOLUME = 0.11;
const UI_SOUND_LENGTH = 0.16;      
const UI_SOUND_TYPE = "sine";
const ANSWER_SOUND_TYPE = "triangle";

let audioContext = null;
let masterVolume = null;
let musicTimer = null;
let soundEnabled = SOUND_ENABLED_AT_START;
let musicStep = 0;

function startAudio() {
  if (!soundEnabled) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  if (!audioContext) {
    try {
      audioContext = new AudioContext();
    } catch (error) {
      return;
    }
    masterVolume = audioContext.createGain();
    masterVolume.gain.value = MUSIC_VOLUME;
    masterVolume.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") audioContext.resume();
  masterVolume.gain.setTargetAtTime(MUSIC_VOLUME, audioContext.currentTime, 0.05);
  if (!musicTimer) {
    playMusicNote();
    musicTimer = window.setInterval(playMusicNote, MUSIC_SPEED_MS);
  }
}

function playMusicNote() {
  if (!audioContext || !masterVolume || !soundEnabled) return;
  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();
  const now = audioContext.currentTime;
  oscillator.type = MUSIC_SOUND_TYPE;
  oscillator.frequency.value = MUSIC_NOTES[musicStep % MUSIC_NOTES.length];
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(MUSIC_NOTE_VOLUME, now + 0.08);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + MUSIC_NOTE_LENGTH);
  oscillator.connect(volume);
  volume.connect(masterVolume);
  oscillator.start(now);
  oscillator.stop(now + MUSIC_NOTE_LENGTH + 0.1);
  musicStep += 1;
}

function playUiSound(kind = "click") {
  if (!soundEnabled) return;
  startAudio();
  if (!audioContext || !masterVolume) return;
  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();
  const frequency = kind === "answer"
    ? ANSWER_SOUND_FREQUENCY
    : kind === "next"
      ? NEXT_SOUND_FREQUENCY
      : CLICK_SOUND_FREQUENCY;
  const now = audioContext.currentTime;
  oscillator.type = kind === "answer" ? ANSWER_SOUND_TYPE : UI_SOUND_TYPE;
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.12, now + 0.08);
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(UI_SOUND_VOLUME, now + 0.01);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + UI_SOUND_LENGTH);
  oscillator.connect(volume);
  volume.connect(masterVolume);
  oscillator.start(now);
  oscillator.stop(now + UI_SOUND_LENGTH + 0.02);
}

function stopMusic() {
  clearInterval(musicTimer);
  musicTimer = null;
}

function toggleAudio() {
  soundEnabled = !soundEnabled;
  const audioButton = document.getElementById("audioButton");
  audioButton.textContent = soundEnabled ? "Sound: On" : "Sound: Off";
  audioButton.setAttribute("aria-pressed", String(soundEnabled));
  if (soundEnabled) {
    startAudio();
    playUiSound();
  } else {
    stopMusic();
    if (masterVolume) masterVolume.gain.setTargetAtTime(0, audioContext.currentTime, 0.05);
  }
}


document.addEventListener("pointerdown", function (event) {
  if (event.target.closest("button, input, label")) playUiSound();
}, true);
document.addEventListener("keydown", function (event) {
  if ((event.key === "Enter" || event.key === " ") && event.target.closest("button")) {
    playUiSound();
  }
}, true);


const titleScreen = document.getElementById("titleScreen");
const setupScreen = document.getElementById("setupScreen");
const playScreen = document.getElementById("playScreen");
const setupForm = document.getElementById("setupForm");
const nameInput = document.getElementById("playerName");
const goalInput = document.getElementById("moneyGoal");
const choices = document.getElementById("choices");
const feedback = document.getElementById("feedback");
const eventDialogue = document.getElementById("eventDialogue");
const questionContent = document.getElementById("questionContent");
const eventView = document.getElementById("eventView");
const customerResponse = document.getElementById("customerResponse");
const customerResponseText = document.getElementById("customerResponseText");
const nextButton = document.getElementById("nextButton");
const eventNextButton = document.getElementById("eventNextButton");
const statusMessage = document.getElementById("statusMessage");
const balanceLabel = document.getElementById("balanceLabel");
const questionPanel = document.getElementById("questionPanel");
const dialoguePanel = document.getElementById("dialoguePanel");
const characterImage = document.getElementById("characterImage");
const STATUS_MESSAGE_MS = 700;
let introTimer = null;
let introVersion = 0;
let introducingCustomer = false;
let statusTimer = null;
let responseTimer = null;
let responseVersion = 0;

function cancelCustomerResponse() {
  clearTimeout(responseTimer);
  responseTimer = null;
  responseVersion += 1;
}

function scheduleCustomerResponse() {
  cancelCustomerResponse();
  if (playScreen.hidden || customerResponse.hidden || document.hidden) return;
  const version = responseVersion;
  const responseGame = game;
  const questionNumber = game.questionNumber;
  responseTimer = setTimeout(function () {
    if (version !== responseVersion || game !== responseGame) return;
    if (game.questionNumber !== questionNumber || playScreen.hidden || customerResponse.hidden) return;
    responseTimer = null;
    finishCustomerResponse();
  }, CUSTOMER_RESPONSE_MS);
}


document.addEventListener("visibilitychange", scheduleCustomerResponse);

function clearStatusMessage() {
  clearTimeout(statusTimer);
  statusTimer = null;
  statusMessage.textContent = "";
}

function showStatusMessage(message) {
  clearTimeout(statusTimer);
  statusMessage.textContent = message;
  statusTimer = setTimeout(clearStatusMessage, STATUS_MESSAGE_MS);
}


function cancelCustomerIntro() {
  clearTimeout(introTimer);
  introVersion += 1;
  introducingCustomer = false;
  characterImage.hidden = true;
  characterImage.removeAttribute("src");
  characterImage.alt = "";
}

function showCustomerImage(customer, introduce, showQuestionPanel = true) {
  const answeredIncorrectly = game.selectedAnswer !== -1
    && game.selectedAnswer !== customer.correctAnswer;
  const showingUnhappySprite = Boolean(answeredIncorrectly && customer.incorrectImage);
  const imagePath = showingUnhappySprite ? customer.incorrectImage : customer.image;
  if (!imagePath) return;

  const version = introVersion;
  introducingCustomer = introduce;
  questionPanel.hidden = introduce || !showQuestionPanel;
  if (introduce) dialoguePanel.hidden = true;
  if (introduce) document.getElementById("characterScene").focus();

  function showQuestion() {
    if (version !== introVersion || playScreen.hidden) return;
    introducingCustomer = false;
    if (showQuestionPanel) questionPanel.hidden = false;
    if (introduce && showQuestionPanel) document.getElementById("customerName").focus();
  }

  const image = new Image();
  let finishedLoading = false;
  function finishLoading(loaded) {
    if (finishedLoading || version !== introVersion || playScreen.hidden) return;
    finishedLoading = true;
    clearTimeout(introTimer);
    if (!loaded) {
      showStatusMessage("Character image could not load. Check its image path in script.js.");
      showQuestion();
      return;
    }
    characterImage.src = imagePath;
    characterImage.alt = (customer.name || "Customer") + (showingUnhappySprite ? " looking unhappy" : "");
    characterImage.hidden = false;
    if (introduce) introTimer = setTimeout(showQuestion, CUSTOMER_INTRO_MS);
    else showQuestion();
  }
  image.onload = function () { finishLoading(true); };
  image.onerror = function () { finishLoading(false); };
  introTimer = setTimeout(function () { finishLoading(false); }, 5000);
  image.src = imagePath;
}

function updateMoneyInputWidth() {
  const text = goalInput.value || goalInput.placeholder;
  goalInput.style.width = Math.max(1, text.length) + "ch";
}
goalInput.addEventListener("input", updateMoneyInputWidth);

function showScreen(screen) {
  cancelCustomerIntro();
  cancelCustomerResponse();
  titleScreen.hidden = true;
  setupScreen.hidden = true;
  playScreen.hidden = true;
  screen.hidden = false;

  if (screen === playScreen) {
    document.body.className = "game-background";
  } else {
    document.body.className = "menu-background";
  }

  clearStatusMessage();
  const heading = screen.querySelector("h1");
  if (heading) heading.focus();
}

function showTitle() {
  showScreen(titleScreen);
  const loadButton = document.getElementById("loadGameButton");
  try {
    const hasSave = Boolean(localStorage.getItem(SAVE_KEY));
    loadButton.hidden = !hasSave;
  } catch (error) {
    loadButton.hidden = true;
  }
}

document.getElementById("newGameButton").addEventListener("click", function () {
  setupForm.reset();
  updateMoneyInputWidth();
  nameInput.setCustomValidity("");
  showScreen(setupScreen);
});

document.getElementById("backButton").addEventListener("click", showTitle);
document.getElementById("titleButton").addEventListener("click", showTitle);
document.getElementById("endTitleButton").addEventListener("click", showTitle);
document.getElementById("audioButton").addEventListener("click", toggleAudio);

setupForm.addEventListener("submit", function (event) {
  event.preventDefault();
  playUiSound("next");
  const playerName = nameInput.value.trim();
  const goal = Number(goalInput.value);
  if (!playerName) {
    nameInput.setCustomValidity("Please enter your name.");
    nameInput.reportValidity();
    return;
  }
  if (!Number.isSafeInteger(goal) || goal < 1 || goal > 1000000) return;

  try {
    if (localStorage.getItem(SAVE_KEY) !== null) {
      if (!window.confirm("Starting a new game will replace your saved game. Continue?")) return;
    }
  } catch (error) {
    
  }

  game = {
    version: 2,
    playerName: playerName,
    goal: goal,
    money: 0,
    customerIndex: 0,
    questionNumber: 1,
    cycleMode: false,
    selectedAnswer: -1,
    customerReplyShown: false,
    eventShown: false
  };
  showScreen(playScreen);
  renderGame(true);
  saveGame();
});

nameInput.addEventListener("input", function () {
  nameInput.setCustomValidity("");
});

function getDialogueEvent(number) {
  return dialogueEvents.find(function (event) {
    return event.question === number;
  });
}

function syncEventViewSize() {
  if (questionPanel.hidden || questionContent.hidden) return;
  const questionHeight = questionContent.getBoundingClientRect().height;
  if (questionHeight > 0) eventView.style.minHeight = Math.ceil(questionHeight) + "px";
}

window.addEventListener("resize", syncEventViewSize);

function renderGame(introduce = false) {
  cancelCustomerIntro();
  cancelCustomerResponse();
  questionPanel.hidden = false;
  dialoguePanel.hidden = true;
  customerResponse.hidden = true;
  questionContent.hidden = false;
  eventView.hidden = true;
  eventNextButton.hidden = true;
  document.getElementById("playerLabel").textContent = game.playerName + "’s Lemonade Stand";
  document.getElementById("moneyLabel").textContent = "Question " + game.questionNumber + " • Earned: $" + game.money + " / Goal: $" + game.goal;
  balanceLabel.textContent = "Balance: $" + game.money;

  const finished = customers.length === 0;
  document.getElementById("customerScreen").hidden = finished;
  document.getElementById("endScreen").hidden = true;
  if (finished) {
    choices.replaceChildren();
    questionPanel.hidden = true;
    return;
  }

  choices.replaceChildren();
  feedback.textContent = "";
  nextButton.hidden = true;

  const customer = customers[game.customerIndex % customers.length];
  const answered = game.selectedAnswer !== -1;
  const ready = customer.question.trim() !== "" && customer.answers.every(function (answer) {
    return answer.trim() !== "";
  });
  const event = getDialogueEvent(game.questionNumber);
  document.getElementById("customerNumber").textContent = "Question " + game.questionNumber + " • " + customer.name;
  document.getElementById("customerName").textContent = customer.name;
  document.getElementById("questionText").textContent = customer.question;
  eventDialogue.textContent = event ? event.dialogue : "";
 
  customerResponseText.textContent = !answered ? "" : game.selectedAnswer === customer.correctAnswer
    ? customer.correctResponse || customer.response || "Thanks!"
    : customer.incorrectResponse || customer.response || "Maybe next time!";

  customer.answers.forEach(function (answer, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = answer;
    button.setAttribute("aria-label", answer || "Reply slot " + (index + 1) + " — not written yet");
    button.disabled = answered || !ready;
    if (answered && index === game.selectedAnswer) {
      button.className = index === customer.correctAnswer ? "correct" : "incorrect";
      button.setAttribute("aria-pressed", "true");
    }
    button.addEventListener("click", function () {
      chooseAnswer(index);
    });
    choices.appendChild(button);
  });

  syncEventViewSize();

  if (answered) {
    feedback.textContent = game.selectedAnswer === customer.correctAnswer
      ? customer.explanation
      : customer.incorrectExplanation || customer.explanation;
  }
  const showingEvent = Boolean(event && answered && game.customerReplyShown && game.eventShown);
  const showingResponse = Boolean(answered && game.customerReplyShown && !showingEvent);
  questionContent.hidden = showingEvent;
  eventView.hidden = !showingEvent;
  eventDialogue.hidden = !showingEvent;
  eventNextButton.hidden = !showingEvent;
  eventNextButton.textContent = "Next";
  customerResponse.hidden = !showingResponse;
  questionPanel.hidden = showingResponse;
  dialoguePanel.hidden = !answered || showingEvent || showingResponse;
  nextButton.hidden = !answered || showingEvent || showingResponse;
  nextButton.textContent = "Next";
  if (showingEvent) eventNextButton.focus();
  else if (showingResponse) customerResponse.focus({ preventScroll: true });
  else if (answered) nextButton.focus();
  else document.getElementById("customerName").focus();

  showCustomerImage(customer, introduce && !answered, !showingResponse);
  if (showingResponse) scheduleCustomerResponse();
}

function chooseAnswer(index) {
  if (introducingCustomer || playScreen.hidden) return;
  if (!game || !customers.length) return;
  if (game.selectedAnswer !== -1) return;
  const customer = customers[game.customerIndex % customers.length];
  if (!customer.question.trim() || customer.answers.some(function (answer) { return !answer.trim(); })) return;
  game.selectedAnswer = index;
  if (index === customer.correctAnswer) game.money += customer.reward;
  playUiSound("answer");
  renderGame();
  saveGame();
}

function goToNextCustomer() {
  if (introducingCustomer || playScreen.hidden) return;
  if (!game || game.selectedAnswer === -1 || !customers.length) return;
  if (!game.customerReplyShown) return;
  if (getDialogueEvent(game.questionNumber) && !game.eventShown) return;
  game.customerIndex = (game.customerIndex + 1) % customers.length;
  game.questionNumber += 1;
  game.cycleMode = game.questionNumber > customers.length;
  game.selectedAnswer = -1;
  game.customerReplyShown = false;
  game.eventShown = false;
  playUiSound("next");
  renderGame(true);
  saveGame();
}

function showCustomerResponse() {
  if (introducingCustomer || playScreen.hidden) return;
  if (!game || game.selectedAnswer === -1 || !customers.length) return;
  if (game.customerReplyShown) return;
  game.customerReplyShown = true;
  playUiSound("next");
  renderGame();
  saveGame();
}


function finishCustomerResponse() {
  if (introducingCustomer || playScreen.hidden) return;
  if (!game || game.selectedAnswer === -1 || !customers.length) return;
  if (!game.customerReplyShown || game.eventShown) return;
  if (!getDialogueEvent(game.questionNumber)) {
    goToNextCustomer();
    return;
  }
  game.eventShown = true;
  playUiSound("next");
  renderGame();
  saveGame();
}

nextButton.addEventListener("click", showCustomerResponse);
eventNextButton.addEventListener("click", goToNextCustomer);


function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    showStatusMessage("Game saved");
  } catch (error) {
    showStatusMessage("Could not save in this browser. Use Download Save to keep a copy.");
  }
}

function isValidSave(save) {
  if (!save || (save.version !== 1 && save.version !== 2)) return false;
  if (typeof save.playerName !== "string" || !save.playerName.trim() || save.playerName.length > 24) return false;
  if (!Number.isSafeInteger(save.goal) || save.goal < 1 || save.goal > 1000000) return false;
  if (!Number.isSafeInteger(save.money) || save.money < 0) return false;
  if (!Number.isInteger(save.customerIndex) || save.customerIndex < 0 || save.customerIndex >= customers.length) return false;
  if (!Number.isInteger(save.selectedAnswer) || save.selectedAnswer < -1 || save.selectedAnswer > 3) return false;
  if (save.version === 2 && (!Number.isInteger(save.questionNumber) || save.questionNumber < 1)) return false;
  return true;
}

document.getElementById("loadGameButton").addEventListener("click", function () {
  try {
    const save = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!isValidSave(save)) {
      showStatusMessage("This save is missing, damaged, or incompatible. Start a new game to replace it.");
      return;
    }
    game = save;
    if (game.version === 1) {
      game.version = 2;
      game.questionNumber = game.customerIndex + 1;
      game.cycleMode = false;
    }
    showScreen(playScreen);
    renderGame(true);
    showStatusMessage("Saved game loaded.");
  } catch (error) {
    showStatusMessage("Could not read your save. Browser storage may be blocked, or the JSON may be damaged.");
  }
});

document.getElementById("saveButton").addEventListener("click", saveGame);

document.getElementById("downloadButton").addEventListener("click", function () {
  const json = JSON.stringify(game, null, 2);
  const file = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lemonade-save.json";
  link.click();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  showStatusMessage("Save download requested. Load game uses the save stored in this browser.");
});


showTitle();

/*
  The imported file had a second complete copy of the runtime appended here.
  Keep it disabled so the first runtime above is the only one that executes.
const customers = [
  {
    name: "Charlie",
    image: "assets/cus1_happy.png",
    incorrectImage: "assets/cus2_sad.png",
    question: "Are you ready to start your Sweet adventure?",
    answers: ["Yes!"],
    correctAnswer: 0,
    reward: 0,
    explanation: "Then Lets Go!",
    incorrectExplanation: "You shouldn't be seeing this",
    correctResponse: "Awesome!",
    incorrectResponse: "Something bad happened if you are reading this"
  },
  {
  name: "Bart",
  image: "assets/cus2_happy.png", 
  incorrectImage: "assets/cus2_sad.png", 
  question: "What is a Goal", 
  answers: ["Profit","Something Someone gives to you", "Something you set out to achieve","Something you buy"] ,
  correctAnswer: 2, 
  reward: 3, 
  explanation: "Correct! A goal is something you set out to achieve.", 
  incorrectExplanation: "Incorrect, a goal is something you set out to achieve", 
  correctResponse: "Thanks!", 
  incorrectResponse: "I'll come back later I guess...",
  },
  {
  name: "Dumb",
  image: "assets/cus5_happy.png", 
  incorrectImage: "assets/cus5_sad.png", 
  question: "Keeping your spare change in a piggy bank after every allowance is an example of what? ", 
  answers: ["Piggy Bank","Checkings","Profit","Savings"] ,
  correctAnswer: 3, 
  reward: 3, 
  explanation: "Correct! That would be an example of savings", 
  incorrectExplanation: "Incorrect, this is an example of savings", 
  correctResponse: "Yummm", 
  incorrectResponse: "I'm Going to The Ice Cream Shack then...",
  },
  {
  name: "Dumber",
  image: "assets/cus3_happy.png", 
  incorrectImage: "assets/cus3_sad.png", 
  question: "If you sell lemonade for $3 and it costs $2 of ingredients per drink then you've made a ", 
  answers: ["Profit","Mistake","Loss","Savings"] ,
  correctAnswer: 3, 
  reward: 3, 
  explanation: "Correct! That would be an example of profit", 
  incorrectExplanation: "Incorrect, this is an example of profit", 
  correctResponse: "Mmmm", 
  incorrectResponse: "Im rating you a 0/10 on yelp"
  }
];


const dialogueEvents = [
  {
    question: 1,
    dialogue: "The Goal Of this Game is to Sell as much Lemonade as possible until you reach your Goal! Earn money by answering questions about finance; each question is different and catered to your current knowledge. You will earn more money per question the further you are. After every several questions or so A dialogue will appear to teach you the next term, you’ll need for future questions. Have Fun and Good Luck! "
  },
];


const CUSTOMER_INTRO_MS = 1500;

const CUSTOMER_RESPONSE_MS = 3000;


const SAVE_KEY = "learn-with-lemonade-save";
let game = null;


const SOUND_ENABLED_AT_START = true;
const MUSIC_VOLUME = 0.16;
const MUSIC_NOTES = [196, 247, 294, 247, 220, 262, 330, 262];
const MUSIC_SPEED_MS = 2400;      
const MUSIC_NOTE_VOLUME = 0.035;   
const MUSIC_NOTE_LENGTH = 1.8;     
const MUSIC_SOUND_TYPE = "sine";  

const CLICK_SOUND_FREQUENCY = 330;
const ANSWER_SOUND_FREQUENCY = 660;
const NEXT_SOUND_FREQUENCY = 520;
const UI_SOUND_VOLUME = 0.11;
const UI_SOUND_LENGTH = 0.16;      
const UI_SOUND_TYPE = "sine";
const ANSWER_SOUND_TYPE = "triangle";

let audioContext = null;
let masterVolume = null;
let musicTimer = null;
let soundEnabled = SOUND_ENABLED_AT_START;
let musicStep = 0;

function startAudio() {
  if (!soundEnabled) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  if (!audioContext) {
    try {
      audioContext = new AudioContext();
    } catch (error) {
      return;
    }
    masterVolume = audioContext.createGain();
    masterVolume.gain.value = MUSIC_VOLUME;
    masterVolume.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") audioContext.resume();
  masterVolume.gain.setTargetAtTime(MUSIC_VOLUME, audioContext.currentTime, 0.05);
  if (!musicTimer) {
    playMusicNote();
    musicTimer = window.setInterval(playMusicNote, MUSIC_SPEED_MS);
  }
}

function playMusicNote() {
  if (!audioContext || !masterVolume || !soundEnabled) return;
  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();
  const now = audioContext.currentTime;
  oscillator.type = MUSIC_SOUND_TYPE;
  oscillator.frequency.value = MUSIC_NOTES[musicStep % MUSIC_NOTES.length];
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(MUSIC_NOTE_VOLUME, now + 0.08);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + MUSIC_NOTE_LENGTH);
  oscillator.connect(volume);
  volume.connect(masterVolume);
  oscillator.start(now);
  oscillator.stop(now + MUSIC_NOTE_LENGTH + 0.1);
  musicStep += 1;
}

function playUiSound(kind = "click") {
  if (!soundEnabled) return;
  startAudio();
  if (!audioContext || !masterVolume) return;
  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();
  const frequency = kind === "answer"
    ? ANSWER_SOUND_FREQUENCY
    : kind === "next"
      ? NEXT_SOUND_FREQUENCY
      : CLICK_SOUND_FREQUENCY;
  const now = audioContext.currentTime;
  oscillator.type = kind === "answer" ? ANSWER_SOUND_TYPE : UI_SOUND_TYPE;
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.12, now + 0.08);
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(UI_SOUND_VOLUME, now + 0.01);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + UI_SOUND_LENGTH);
  oscillator.connect(volume);
  volume.connect(masterVolume);
  oscillator.start(now);
  oscillator.stop(now + UI_SOUND_LENGTH + 0.02);
}

function stopMusic() {
  clearInterval(musicTimer);
  musicTimer = null;
}

function toggleAudio() {
  soundEnabled = !soundEnabled;
  const audioButton = document.getElementById("audioButton");
  audioButton.textContent = soundEnabled ? "Sound: On" : "Sound: Off";
  audioButton.setAttribute("aria-pressed", String(soundEnabled));
  if (soundEnabled) {
    startAudio();
    playUiSound();
  } else {
    stopMusic();
    if (masterVolume) masterVolume.gain.setTargetAtTime(0, audioContext.currentTime, 0.05);
  }
}


document.addEventListener("pointerdown", function (event) {
  if (event.target.closest("button, input, label")) playUiSound();
}, true);
document.addEventListener("keydown", function (event) {
  if ((event.key === "Enter" || event.key === " ") && event.target.closest("button")) {
    playUiSound();
  }
}, true);


const titleScreen = document.getElementById("titleScreen");
const setupScreen = document.getElementById("setupScreen");
const playScreen = document.getElementById("playScreen");
const setupForm = document.getElementById("setupForm");
const nameInput = document.getElementById("playerName");
const goalInput = document.getElementById("moneyGoal");
const choices = document.getElementById("choices");
const feedback = document.getElementById("feedback");
const eventDialogue = document.getElementById("eventDialogue");
const questionContent = document.getElementById("questionContent");
const eventView = document.getElementById("eventView");
const customerResponse = document.getElementById("customerResponse");
const customerResponseText = document.getElementById("customerResponseText");
const nextButton = document.getElementById("nextButton");
const eventNextButton = document.getElementById("eventNextButton");
const statusMessage = document.getElementById("statusMessage");
const balanceLabel = document.getElementById("balanceLabel");
const questionPanel = document.getElementById("questionPanel");
const dialoguePanel = document.getElementById("dialoguePanel");
const characterImage = document.getElementById("characterImage");
const STATUS_MESSAGE_MS = 700;
let introTimer = null;
let introVersion = 0;
let introducingCustomer = false;
let statusTimer = null;
let responseTimer = null;
let responseVersion = 0;

function cancelCustomerResponse() {
  clearTimeout(responseTimer);
  responseTimer = null;
  responseVersion += 1;
}

function scheduleCustomerResponse() {
  cancelCustomerResponse();
  if (playScreen.hidden || customerResponse.hidden || document.hidden) return;
  const version = responseVersion;
  const responseGame = game;
  const questionNumber = game.questionNumber;
  responseTimer = setTimeout(function () {
    if (version !== responseVersion || game !== responseGame) return;
    if (game.questionNumber !== questionNumber || playScreen.hidden || customerResponse.hidden) return;
    responseTimer = null;
    finishCustomerResponse();
  }, CUSTOMER_RESPONSE_MS);
}


document.addEventListener("visibilitychange", scheduleCustomerResponse);

function clearStatusMessage() {
  clearTimeout(statusTimer);
  statusTimer = null;
  statusMessage.textContent = "";
}

function showStatusMessage(message) {
  clearTimeout(statusTimer);
  statusMessage.textContent = message;
  statusTimer = setTimeout(clearStatusMessage, STATUS_MESSAGE_MS);
}


function cancelCustomerIntro() {
  clearTimeout(introTimer);
  introVersion += 1;
  introducingCustomer = false;
  characterImage.hidden = true;
  characterImage.removeAttribute("src");
  characterImage.alt = "";
}

function showCustomerImage(customer, introduce, showQuestionPanel = true) {
  const answeredIncorrectly = game.selectedAnswer !== -1
    && game.selectedAnswer !== customer.correctAnswer;
  const showingUnhappySprite = Boolean(answeredIncorrectly && customer.incorrectImage);
  const imagePath = showingUnhappySprite ? customer.incorrectImage : customer.image;
  if (!imagePath) return;

  const version = introVersion;
  introducingCustomer = introduce;
  questionPanel.hidden = introduce || !showQuestionPanel;
  if (introduce) dialoguePanel.hidden = true;
  if (introduce) document.getElementById("characterScene").focus();

  function showQuestion() {
    if (version !== introVersion || playScreen.hidden) return;
    introducingCustomer = false;
    if (showQuestionPanel) questionPanel.hidden = false;
    if (introduce && showQuestionPanel) document.getElementById("customerName").focus();
  }

  const image = new Image();
  let finishedLoading = false;
  function finishLoading(loaded) {
    if (finishedLoading || version !== introVersion || playScreen.hidden) return;
    finishedLoading = true;
    clearTimeout(introTimer);
    if (!loaded) {
      showStatusMessage("Character image could not load. Check its image path in script.js.");
      showQuestion();
      return;
    }
    characterImage.src = imagePath;
    characterImage.alt = (customer.name || "Customer") + (showingUnhappySprite ? " looking unhappy" : "");
    characterImage.hidden = false;
    if (introduce) introTimer = setTimeout(showQuestion, CUSTOMER_INTRO_MS);
    else showQuestion();
  }
  image.onload = function () { finishLoading(true); };
  image.onerror = function () { finishLoading(false); };
  introTimer = setTimeout(function () { finishLoading(false); }, 5000);
  image.src = imagePath;
}

function updateMoneyInputWidth() {
  const text = goalInput.value || goalInput.placeholder;
  goalInput.style.width = Math.max(1, text.length) + "ch";
}
goalInput.addEventListener("input", updateMoneyInputWidth);

function showScreen(screen) {
  cancelCustomerIntro();
  cancelCustomerResponse();
  titleScreen.hidden = true;
  setupScreen.hidden = true;
  playScreen.hidden = true;
  screen.hidden = false;

  if (screen === playScreen) {
    document.body.className = "game-background";
  } else {
    document.body.className = "menu-background";
  }

  clearStatusMessage();
  const heading = screen.querySelector("h1");
  if (heading) heading.focus();
}

function showTitle() {
  showScreen(titleScreen);
  const loadButton = document.getElementById("loadGameButton");
  try {
    const hasSave = Boolean(localStorage.getItem(SAVE_KEY));
    loadButton.hidden = !hasSave;
  } catch (error) {
    loadButton.hidden = true;
  }
}

document.getElementById("newGameButton").addEventListener("click", function () {
  setupForm.reset();
  updateMoneyInputWidth();
  nameInput.setCustomValidity("");
  showScreen(setupScreen);
});

document.getElementById("backButton").addEventListener("click", showTitle);
document.getElementById("titleButton").addEventListener("click", showTitle);
document.getElementById("endTitleButton").addEventListener("click", showTitle);
document.getElementById("audioButton").addEventListener("click", toggleAudio);

setupForm.addEventListener("submit", function (event) {
  event.preventDefault();
  playUiSound("next");
  const playerName = nameInput.value.trim();
  const goal = Number(goalInput.value);
  if (!playerName) {
    nameInput.setCustomValidity("Please enter your name.");
    nameInput.reportValidity();
    return;
  }
  if (!Number.isSafeInteger(goal) || goal < 1 || goal > 1000000) return;

  try {
    if (localStorage.getItem(SAVE_KEY) !== null) {
      if (!window.confirm("Starting a new game will replace your saved game. Continue?")) return;
    }
  } catch (error) {
    
  }

  game = {
    version: 2,
    playerName: playerName,
    goal: goal,
    money: 0,
    customerIndex: 0,
    questionNumber: 1,
    cycleMode: false,
    selectedAnswer: -1,
    customerReplyShown: false,
    eventShown: false
  };
  showScreen(playScreen);
  renderGame(true);
  saveGame();
});

nameInput.addEventListener("input", function () {
  nameInput.setCustomValidity("");
});

function getDialogueEvent(number) {
  return dialogueEvents.find(function (event) {
    return event.question === number;
  });
}

function syncEventViewSize() {
  if (questionPanel.hidden || questionContent.hidden) return;
  const questionHeight = questionContent.getBoundingClientRect().height;
  if (questionHeight > 0) eventView.style.minHeight = Math.ceil(questionHeight) + "px";
}

window.addEventListener("resize", syncEventViewSize);

function renderGame(introduce = false) {
  cancelCustomerIntro();
  cancelCustomerResponse();
  questionPanel.hidden = false;
  dialoguePanel.hidden = true;
  customerResponse.hidden = true;
  questionContent.hidden = false;
  eventView.hidden = true;
  eventNextButton.hidden = true;
  document.getElementById("playerLabel").textContent = game.playerName + "’s Lemonade Stand";
  document.getElementById("moneyLabel").textContent = "Question " + game.questionNumber + " • Earned: $" + game.money + " / Goal: $" + game.goal;
  balanceLabel.textContent = "Balance: $" + game.money;

  const finished = customers.length === 0;
  document.getElementById("customerScreen").hidden = finished;
  document.getElementById("endScreen").hidden = true;
  if (finished) {
    choices.replaceChildren();
    questionPanel.hidden = true;
    return;
  }

  choices.replaceChildren();
  feedback.textContent = "";
  nextButton.hidden = true;

  const customer = customers[game.customerIndex % customers.length];
  const answered = game.selectedAnswer !== -1;
  const ready = customer.question.trim() !== "" && customer.answers.every(function (answer) {
    return answer.trim() !== "";
  });
  const event = getDialogueEvent(game.questionNumber);
  document.getElementById("customerNumber").textContent = "Question " + game.questionNumber + " • " + customer.name;
  document.getElementById("customerName").textContent = customer.name;
  document.getElementById("questionText").textContent = customer.question;
  eventDialogue.textContent = event ? event.dialogue : "";
 
  customerResponseText.textContent = !answered ? "" : game.selectedAnswer === customer.correctAnswer
    ? customer.correctResponse || customer.response || "Thanks!"
    : customer.incorrectResponse || customer.response || "Maybe next time!";

  customer.answers.forEach(function (answer, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = answer;
    button.setAttribute("aria-label", answer || "Reply slot " + (index + 1) + " — not written yet");
    button.disabled = answered || !ready;
    if (answered && index === game.selectedAnswer) {
      button.className = index === customer.correctAnswer ? "correct" : "incorrect";
      button.setAttribute("aria-pressed", "true");
    }
    button.addEventListener("click", function () {
      chooseAnswer(index);
    });
    choices.appendChild(button);
  });

  syncEventViewSize();

  if (answered) {
    feedback.textContent = game.selectedAnswer === customer.correctAnswer
      ? customer.explanation
      : customer.incorrectExplanation || customer.explanation;
  }
  const showingEvent = Boolean(event && answered && game.customerReplyShown && game.eventShown);
  const showingResponse = Boolean(answered && game.customerReplyShown && !showingEvent);
  questionContent.hidden = showingEvent;
  eventView.hidden = !showingEvent;
  eventDialogue.hidden = !showingEvent;
  eventNextButton.hidden = !showingEvent;
  eventNextButton.textContent = "Next";
  customerResponse.hidden = !showingResponse;
  questionPanel.hidden = showingResponse;
  dialoguePanel.hidden = !answered || showingEvent || showingResponse;
  nextButton.hidden = !answered || showingEvent || showingResponse;
  nextButton.textContent = "Next";
  if (showingEvent) eventNextButton.focus();
  else if (showingResponse) customerResponse.focus({ preventScroll: true });
  else if (answered) nextButton.focus();
  else document.getElementById("customerName").focus();

  showCustomerImage(customer, introduce && !answered, !showingResponse);
  if (showingResponse) scheduleCustomerResponse();
}

function chooseAnswer(index) {
  if (introducingCustomer || playScreen.hidden) return;
  if (!game || !customers.length) return;
  if (game.selectedAnswer !== -1) return;
  const customer = customers[game.customerIndex % customers.length];
  if (!customer.question.trim() || customer.answers.some(function (answer) { return !answer.trim(); })) return;
  game.selectedAnswer = index;
  if (index === customer.correctAnswer) game.money += customer.reward;
  playUiSound("answer");
  renderGame();
  saveGame();
}

function goToNextCustomer() {
  if (introducingCustomer || playScreen.hidden) return;
  if (!game || game.selectedAnswer === -1 || !customers.length) return;
  if (!game.customerReplyShown) return;
  if (getDialogueEvent(game.questionNumber) && !game.eventShown) return;
  game.customerIndex = (game.customerIndex + 1) % customers.length;
  game.questionNumber += 1;
  game.cycleMode = game.questionNumber > customers.length;
  game.selectedAnswer = -1;
  game.customerReplyShown = false;
  game.eventShown = false;
  playUiSound("next");
  renderGame(true);
  saveGame();
}

function showCustomerResponse() {
  if (introducingCustomer || playScreen.hidden) return;
  if (!game || game.selectedAnswer === -1 || !customers.length) return;
  if (game.customerReplyShown) return;
  game.customerReplyShown = true;
  playUiSound("next");
  renderGame();
  saveGame();
}


function finishCustomerResponse() {
  if (introducingCustomer || playScreen.hidden) return;
  if (!game || game.selectedAnswer === -1 || !customers.length) return;
  if (!game.customerReplyShown || game.eventShown) return;
  if (!getDialogueEvent(game.questionNumber)) {
    goToNextCustomer();
    return;
  }
  game.eventShown = true;
  playUiSound("next");
  renderGame();
  saveGame();
}

nextButton.addEventListener("click", showCustomerResponse);
eventNextButton.addEventListener("click", goToNextCustomer);


function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    showStatusMessage("Game saved");
  } catch (error) {
    showStatusMessage("Could not save in this browser. Use Download Save to keep a copy.");
  }
}

function isValidSave(save) {
  if (!save || (save.version !== 1 && save.version !== 2)) return false;
  if (typeof save.playerName !== "string" || !save.playerName.trim() || save.playerName.length > 24) return false;
  if (!Number.isSafeInteger(save.goal) || save.goal < 1 || save.goal > 1000000) return false;
  if (!Number.isSafeInteger(save.money) || save.money < 0) return false;
  if (!Number.isInteger(save.customerIndex) || save.customerIndex < 0 || save.customerIndex >= customers.length) return false;
  if (!Number.isInteger(save.selectedAnswer) || save.selectedAnswer < -1 || save.selectedAnswer > 3) return false;
  if (save.version === 2 && (!Number.isInteger(save.questionNumber) || save.questionNumber < 1)) return false;
  return true;
}

document.getElementById("loadGameButton").addEventListener("click", function () {
  try {
    const save = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!isValidSave(save)) {
      showStatusMessage("This save is missing, damaged, or incompatible. Start a new game to replace it.");
      return;
    }
    game = save;
    if (game.version === 1) {
      game.version = 2;
      game.questionNumber = game.customerIndex + 1;
      game.cycleMode = false;
    }
    showScreen(playScreen);
    renderGame(true);
    showStatusMessage("Saved game loaded.");
  } catch (error) {
    showStatusMessage("Could not read your save. Browser storage may be blocked, or the JSON may be damaged.");
  }
});

document.getElementById("saveButton").addEventListener("click", saveGame);

document.getElementById("downloadButton").addEventListener("click", function () {
  const json = JSON.stringify(game, null, 2);
  const file = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lemonade-save.json";
  link.click();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  showStatusMessage("Save download requested. Load game uses the save stored in this browser.");
});


showTitle();
*/