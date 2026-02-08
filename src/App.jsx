import { useState } from 'react';
import './styles.css';
import { useAuth } from './hooks/useAuth';
import { useSimulation } from './hooks/useSimulation';
import SignIn from './components/Auth/SignIn';
import ApiKeyInput from './components/Setup/ApiKeyInput';
import ProjectSetup from './components/Setup/ProjectSetup';
import Header from './components/Layout/Header';
import SimulationView from './components/Simulation/SimulationView';

function App() {
  const { user, loading, setDemoUser, clearDemoUser } = useAuth();
  const [apiKey, setApiKey] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [screen, setScreen] = useState('setup'); // 'setup' | 'simulation'

  const simulation = useSimulation();

  function handleSignIn(signedInUser) {
    setDemoUser(signedInUser);
  }

  function handleSignOut() {
    clearDemoUser();
    setApiKey(null);
    setScreen('setup');
    setProjectName('');
  }

  function handleApiKey(key) {
    setApiKey(key);
  }

  function handleProjectStart({ projectName: name, sowContent, staffingPlan, additionalContext }) {
    setProjectName(name);
    setScreen('simulation');
    simulation.startSimulation({
      apiKey,
      sowContent,
      staffingPlan,
      additionalContext,
    });
  }

  if (loading) {
    return (
      <div className="signin-container">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <SignIn onSignIn={handleSignIn} />;
  }

  if (!apiKey) {
    return (
      <div className="app-container">
        <Header user={user} onSignOut={handleSignOut} />
        <ApiKeyInput onSubmit={handleApiKey} />
      </div>
    );
  }

  if (screen === 'setup') {
    return (
      <div className="app-container">
        <Header user={user} onSignOut={handleSignOut} />
        <ProjectSetup
          onStart={handleProjectStart}
          onBack={() => setApiKey(null)}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header user={user} projectName={projectName} onSignOut={handleSignOut} />
      <SimulationView
        agentStatuses={simulation.agentStatuses}
        agentTasks={simulation.agentTasks}
        messages={simulation.messages}
        deliverables={simulation.deliverables}
        typingAgents={simulation.typingAgents}
        currentPhase={simulation.currentPhase}
        progress={simulation.progress}
        isComplete={simulation.isComplete}
        isRunning={simulation.isRunning}
        error={simulation.error}
        projectRoles={simulation.projectRoles}
      />
    </div>
  );
}

export default App;
