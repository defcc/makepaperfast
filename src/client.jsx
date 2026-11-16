import { hydrateRoot } from 'react-dom/client';
import { Editor } from './editor.jsx';

hydrateRoot(document.getElementById('editor'), <Editor url={new URL(location.href)} />);
