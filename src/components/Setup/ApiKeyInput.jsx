import { useState } from 'react';

export default function ApiKeyInput({ onSubmit }) {
  const [apiKey, setApiKey] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (apiKey.trim()) {
      onSubmit(apiKey.trim());
    }
  }

  return (
    <div className="setup-container">
      <div className="setup-card">
        <div className="setup-step">Step 1 of 2</div>
        <h2>Gemini API Key</h2>
        <p>Enter your Gemini API key. It will only be stored in memory and used for this session.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>API Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="AIza..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoFocus
            />
            <p className="form-hint">
              Get your API key from Google AI Studio. Your key is never stored or sent anywhere except Gemini.
            </p>
          </div>
          <button type="submit" className="btn-primary" disabled={!apiKey.trim()}>
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
