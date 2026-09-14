"use client";
import { useState } from "react";
import Link from "next/link";
import { File, Folder, Monitor, ArrowUpRight, Play, Pause, Minus, Square, RotateCcw } from "lucide-react";
import { beats } from "@/data/mock-beats";
import { usePlayer } from "@/stores/player-store";
const folders = ["SOUNDS", "COMPOSITIONS", "PACKS", "VOTE_TO_HACK", "README.TXT"] as const;
type Directory = typeof folders[number];
export function FileDirectory({preview = true}: {preview?: boolean}) {
  const [folder,setFolder]=useState<Directory>("SOUNDS");
  const [selected,setSelected]=useState(beats[0].id);
  const [minimized,setMinimized]=useState(false);
  const [expanded,setExpanded]=useState(false);
  const player=usePlayer();
  const files=folder === "COMPOSITIONS" ? beats.filter(beat=>beat.genre === "R&B" || beat.genre === "Ambient") : beats;
  const beat=beats.find(beat=>beat.id===selected)!;
  const playing=player.trackId===beat.id && player.isPlaying;
  function openFolder(value: Directory){setFolder(value);setMinimized(false);if(value==="COMPOSITIONS")setSelected(beats.find(b=>b.genre==="R&B")!.id);}
  return <div className="directory-theme page-width">
    {preview && <div className="directory-comparison"><span>DESIGN 01 / FILE DIRECTORY</span><Link href="/preview/original">View original design <ArrowUpRight size={12}/></Link></div>}
    <section className="directory-hero" aria-labelledby="directory-title">
      <div className="directory-intro"><h1 id="directory-title">Sounds that weren?t<br/>supposed to be found.</h1><span>CONNECTION ESTABLISHED<br/><b>YOU?RE IN.</b></span></div>
      <div className="computer-window" data-expanded={expanded}>
        <div className="computer-title"><span><Monitor size={13}/> C:&#92;LOST_FILES&#92;{folder === "README.TXT" ? "" : folder}</span><div><button aria-label={minimized?"Restore directory":"Minimize directory"} onClick={()=>setMinimized(!minimized)}><Minus size={12}/></button><button aria-label={expanded?"Restore window size":"Expand directory"} onClick={()=>setExpanded(!expanded)}><Square size={10}/></button></div></div>
        {!minimized && <><div className="computer-menu"><span>File</span><span>Edit</span><span>View</span><span>Find</span><span className="computer-readonly">LOST FILES EXPLORER</span></div>
        <div className="directory-browser"><nav aria-label="Archive folders" className="directory-folders">{folders.map(name=><button key={name} aria-pressed={folder===name} onClick={()=>openFolder(name)}>{name==="README.TXT"?<File size={17}/>:<Folder size={17}/>}<span>{name}</span></button>)}</nav>
        <div className="directory-files">
          {folder === "PACKS" ? <div className="directory-document"><Folder size={32}/><h2>SOUND_PACKS&#92;</h2><p>Collections for your next session. Explore the pack archive.</p><Link href="/packs">[ OPEN PACK ARCHIVE ? ]</Link></div> : folder === "VOTE_TO_HACK" ? <div className="directory-document"><Monitor size={32}/><h2>NEXT_TARGET.EXE</h2><p>Choose the city. We?ll discover the producers shaping its sound.</p><Link href="/producers">[ OPEN WORLD ATLAS ? ]</Link></div> : folder === "README.TXT" ? <div className="directory-document"><span>LOST FILES LIBRARY / README.TXT</span><h2>Real sounds.<br/>Independent sources.</h2><p>Browse the directory. Select a file to inspect it. Preview a sound, choose a license, and make it yours.</p><p>Your purchased files stay in My Library, ready whenever inspiration hits.</p><Link href="/library">[ OPEN MY LIBRARY ? ]</Link></div> : <><div className="directory-columns"><span>NAME</span><span>TYPE</span><span>BPM</span></div><div className="directory-file-list" aria-label="Sound files">{files.map(file=><button key={file.id} className="directory-file" aria-pressed={selected===file.id} onClick={()=>setSelected(file.id)} onDoubleClick={()=>player.play(file.id)}><span><File size={14}/>{file.title.toUpperCase().replaceAll(" ","_")}.WAV</span><span>{file.genre.toUpperCase()}</span><span>{file.bpm}</span></button>)}</div></>}
        </div></div><div className="computer-status"><span>{folder === "SOUNDS" || folder === "COMPOSITIONS" ? files.length + " file(s)" : "1 directory"}</span><span>INDEPENDENT AUDIO ARCHIVE</span><span aria-hidden="true">?</span></div></>}
      </div>
      <div className="directory-console" role="status"><span className="terminal-prompt">&gt;</span>{minimized ? "DIRECTORY MINIMIZED. RESTORE TO CONTINUE." : "SELECT A FILE TO INSPECT. DOUBLE-CLICK TO PREVIEW."}<span className="terminal-caret" aria-hidden="true">?</span></div>
      <div className="file-inspector"><div><span className="directory-label">FILE SELECTED / {beat.producer.toUpperCase()}</span><h2>{beat.title}</h2><span>{beat.bpm} BPM / {beat.key} / SYNTHETIC DEMO PREVIEW</span></div><div className="inspector-actions"><button onClick={()=>player.play(beat.id)}>{playing?<Pause size={13}/>:<Play size={13}/>} {playing?"PAUSE":"PREVIEW"}</button><Link href={"/beats/"+beat.slug}>OPEN FILE <ArrowUpRight size={13}/></Link></div></div>
      <div className="directory-footnote"><span>SOUNDS FOR<br/>WHAT?S NEXT.</span><span>ARCHIVE<br/>CREATE<br/>EXPLORE</span></div>
    </section>
    <section className="directory-featured"><div className="directory-section-title"><h2>Featured files:</h2><Link href="/beats">View all ?</Link></div><div className="directory-feature-grid">{beats.slice(0,2).map((file,index)=><Link key={file.id} href={"/beats/"+file.slug} className="directory-feature"><div className={"directory-art art-"+index}><span className="art-corner">LF / 00{index+1}</span><span className="art-script">{file.title.split(" ").map(word=><span key={word}>{word}<br/></span>)}</span><span className="art-bottom">ORIGINAL SOUND / {file.bpm} BPM</span></div><h3>{file.title.toUpperCase()}</h3><p>{file.producer} / {file.genre}<ArrowUpRight size={14}/></p></Link>)}</div></section>
    <section className="directory-more"><div className="directory-section-title"><h2>More sounds:</h2><span>RECOVERED FROM THE ARCHIVE</span></div><div className="directory-more-grid">{beats.slice(2,6).map((file,index)=><Link href={"/beats/"+file.slug} key={file.id}><div className="mini-file"><File size={32}/><span>00{index+3}</span></div><h3>{file.title}</h3><span>{file.genre} <ArrowUpRight size={12}/></span></Link>)}</div></section>
    {preview && <div className="directory-return"><Link href="/preview/original"><RotateCcw size={13}/> Compare with original homepage</Link><span>END OF DIRECTORY_</span></div>}
  </div>;
}
