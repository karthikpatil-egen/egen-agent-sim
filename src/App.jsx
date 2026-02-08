import { useState } from 'react';
import './styles.css';
import { useAuth } from './hooks/useAuth';
import { useSimulation } from './hooks/useSimulation';
import { useConfig } from './hooks/useConfig';
import SignIn from './components/Auth/SignIn';
import ApiKeyInput from './components/Setup/ApiKeyInput';
import ProjectSetup from './components/Setup/ProjectSetup';
import Header from './components/Layout/Header';
import SimulationView from './components/Simulation/SimulationView';
import AdminPanel from './components/Admin/AdminPanel';

function App() {
  const { user, loading, isSuperAdmin, setDemoUser, clearDemoUser } = useAuth();
  const { config, loading: configLoading, updateConfig } = useConfig();
  const [apiKey, setApiKey] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [screen, setScreen] = useState('setup'); // 'setup' | 'simulation' | 'admin'
  const [prevScreen, setPrevScreen] = useState('setup');

  const simulation = useSimulation(config);

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

  function handleProjectStart({ projectName: name, sowContent, staffingPlan, additionalContext, sowStartDate, sowEndDate }) {
    setProjectName(name);
    setScreen('simulation');
    simulation.startSimulation({
      apiKey,
      sowContent,
      staffingPlan,
      additionalContext,
      sowStartDate,
      sowEndDate,
    });
  }

  function handleAdminClick() {
    setPrevScreen(screen);
    setScreen('admin');
  }

  function handleAdminBack() {
    setScreen(prevScreen);
  }

  if (loading || configLoading) {
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
        <Header user={user} onSignOut={handleSignOut} isSuperAdmin={isSuperAdmin} onAdminClick={handleAdminClick} />
        {screen === 'admin' && config ? (
          <AdminPanel config={config} onSave={updateConfig} onBack={handleAdminBack} />
        ) : (
          <ApiKeyInput onSubmit={handleApiKey} />
        )}
      </div>
    );
  }

  if (screen === 'admin' && config) {
    return (
      <div className="app-container">
        <Header user={user} onSignOut={handleSignOut} isSuperAdmin={isSuperAdmin} onAdminClick={handleAdminClick} />
        <AdminPanel config={config} onSave={updateConfig} onBack={handleAdminBack} />
      </div>
    );
  }

  if (screen === 'setup') {
    return (
      <div className="app-container">
        <Header user={user} onSignOut={handleSignOut} isSuperAdmin={isSuperAdmin} onAdminClick={handleAdminClick} />
        <ProjectSetup
          onStart={handleProjectStart}
          onBack={() => setApiKey(null)}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header user={user} projectName={projectName} onSignOut={handleSignOut} isSuperAdmin={isSuperAdmin} onAdminClick={handleAdminClick} />
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
        insights={simulation.insights}
        insightsLoading={simulation.insightsLoading}
        insightsError={simulation.insightsError}
        simulatedDate={simulation.simulatedDate}
        sowStartDate={simulation.sowStartDate}
        sowEndDate={simulation.sowEndDate}
      />
    </div>
  );
}

export default App;
