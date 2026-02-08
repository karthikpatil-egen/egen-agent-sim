import { logOut } from '../../services/firebase';

export default function Header({ user, projectName, onSignOut }) {
  async function handleSignOut() {
    try {
      await logOut();
    } catch {
      // ignore
    }
    onSignOut?.();
  }

  return (
    <header className="header">
      <div className="header-logo">
        Egen <span>Agent Simulator</span>
      </div>
      <div className="header-right">
        {projectName && <span className="header-project">{projectName}</span>}
        {user && (
          <>
            <span className="header-user">
              {user.photoURL && <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />}
              {user.displayName || user.email}
            </span>
            <button className="header-signout" onClick={handleSignOut}>
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
