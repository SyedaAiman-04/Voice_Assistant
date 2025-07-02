let currentUtterance = null;
let pausedPosition = 0;
document.addEventListener('DOMContentLoaded', () => {
    const micButton = document.getElementById('micButton');
    const responseBox = document.getElementById('responseBox');
    const statusIndicator = document.getElementById('statusIndicator');
    const assistantFace = document.getElementById('assistantFace');
    const mouth = document.getElementById('mouth');
    document.getElementById('pauseBtn').addEventListener('click', () => {
    if (currentUtterance && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        pausedPosition = window.speechSynthesis.paused ? 
            currentUtterance.text.length - currentUtterance.text.length : 0;
        document.getElementById('pauseBtn').style.display = 'none';
        document.getElementById('resumeBtn').style.display = 'block';
    }
});
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && currentUtterance) {
        if (window.speechSynthesis.speaking) {
            document.getElementById('pauseBtn').click();
        } else if (window.speechSynthesis.paused) {
            document.getElementById('resumeBtn').click();
        }
    }
});
document.getElementById('resumeBtn').addEventListener('click', () => {
    if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        document.getElementById('pauseBtn').style.display = 'block';
        document.getElementById('resumeBtn').style.display = 'none';
    }
});

document.getElementById('stopBtn').addEventListener('click', () => {
    window.speechSynthesis.cancel();
    currentUtterance = null;
    pausedPosition = 0;
    animateMouth(false);
    document.getElementById('pauseBtn').style.display = 'block';
    document.getElementById('resumeBtn').style.display = 'none';
});

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // Animation states
    let isListening = false;

    // Visual feedback for listening state
    recognition.onstart = () => {
        isListening = true;
        updateUI();
        animateMouth(true);
    };

    recognition.onend = () => {
        isListening = false;
        updateUI();
        animateMouth(false);
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        addMessage(transcript, 'user-message');
        
        fetch('/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: transcript })
        })
        .then(response => response.json())
        .then(data => {
            addMessage(data.text, 'assistant-message');
            speak(data.text);
            
            if (data.action === "open_url") {
                window.open(data.url, '_blank');
                animateSuccess();
            }
        })
        .catch(error => {
            addMessage("Sorry, I encountered an error", 'error-message');
            console.error('Error:', error);
        });
    };

    recognition.onerror = (event) => {
        addMessage(`Error: ${event.error}`, 'error-message');
        animateError();
    };

    // Button click handler
    micButton.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });

    // Helper functions
    function updateUI() {
        micButton.classList.toggle('listening', isListening);
        statusIndicator.querySelector('span').textContent = isListening ? 'Listening...' : 'Ready';
        statusIndicator.querySelector('.pulse').style.background = isListening ? '#ff6584' : '#4caf50';
    }

    function addMessage(text, className) {
        const messageElement = document.createElement('p');
        messageElement.classList.add(className);
        messageElement.textContent = text;
        responseBox.appendChild(messageElement);
        responseBox.scrollTop = responseBox.scrollHeight;
    }

    // Modify your speak() function
function speak(text) {
    if (currentUtterance) {
        window.speechSynthesis.cancel(); // Stop any ongoing speech
    }
    
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.rate = 1;
    currentUtterance.pitch = 1;
    
    // Resume from paused position if applicable
    if (pausedPosition > 0) {
        currentUtterance.text = text.substring(pausedPosition);
        pausedPosition = 0;
    }
    
    window.speechSynthesis.speak(currentUtterance);
    animateMouth(true);
    
    currentUtterance.onend = () => {
        animateMouth(false);
        currentUtterance = null;
    };
}

    function animateMouth(talking) {
        if (talking) {
            mouth.style.height = '5px';
            mouth.style.borderRadius = '20px';
            mouth.style.animation = 'talk 0.3s alternate infinite';
        } else {
            mouth.style.height = '10px';
            mouth.style.borderRadius = '0 0 20px 20px';
            mouth.style.animation = 'none';
        }
    }

    function animateSuccess() {
        assistantFace.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            assistantFace.style.transform = 'translateY(0)';
        }, 300);
    }

    function animateError() {
        assistantFace.style.animation = 'shake 0.5s';
        setTimeout(() => {
            assistantFace.style.animation = 'none';
        }, 500);
    }

    // Add CSS animations dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes talk {
            0% { width: 30px; }
            100% { width: 50px; }
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-10px); }
            40% { transform: translateX(10px); }
            60% { transform: translateX(-10px); }
            80% { transform: translateX(10px); }
        }
    `;
    document.head.appendChild(style);
});