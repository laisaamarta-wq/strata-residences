import { createRoot } from 'react-dom/client'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource-variable/hanken-grotesk'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
// the production stylesheet: the stage, slices, facades, plans and tokens are reused as-is
import '../styles.css'
import './case.css'
import CaseStudy from './CaseStudy.jsx'

createRoot(document.getElementById('root')).render(<CaseStudy />)
