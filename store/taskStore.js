'use client';
import { create } from 'zustand';
import { KEY, demoWorkspace, initialSettings, validateWorkspace, migrateLegacy, makeTask, nextRecurring, uid } from '../lib/workspace';

export const useWorkspace = create((set,get) => ({
  tasks:[], projects:[], settings:initialSettings, demo:false, ready:false, storageError:'', toast:null,
  hydrate:() => {
    if(get().ready) return;
    try {
      const saved=localStorage.getItem(KEY), legacy=localStorage.getItem('daybook.tasks.v1');
      const data=saved !== null ? validateWorkspace(JSON.parse(saved)) : legacy !== null ? migrateLegacy(legacy) : demoWorkspace();
      set({...data,ready:true});
    } catch {set({ready:true,storageError:'Saved data could not be read. Export or recover it before making changes.',toast:{message:'Saved data could not be loaded. Your original storage has not been changed.'}});}
  },
  save:(changes,toast=null) => {
    set(changes);
    const {tasks,projects,settings,demo}=get();
    try {localStorage.setItem(KEY,JSON.stringify({version:2,tasks,projects,settings,demo}));set({storageError:'',...(toast?{toast}:{})});}
    catch {set({storageError:'Changes are only in memory. Export a backup before closing this tab.',toast:{...toast,message:'Storage is full or unavailable. Export your workspace to keep these changes.'}});}
  },
  addTask:values=>{const task=makeTask(values);get().save({tasks:[task,...get().tasks]});return task.id;},
  updateTask:(id,changes)=>get().save({tasks:get().tasks.map(t=>t.id===id?{...t,...changes}:t)}),
  completeTask:(id,completed)=>{
    const original=get().tasks.find(t=>t.id===id);if(!original)return;
    const tasks=get().tasks.map(t=>t.id===id?{...t,completed,status:completed?'done':'todo',completedAt:completed?Date.now():null}:t);
    if(completed && !original.completed && original.recurrence!=='none' && !get().tasks.some(t=>t.recurringFrom===id)) {const next=nextRecurring(original);if(next)tasks.unshift({...next,recurringFrom:id});}
    get().save({tasks});
  },
  duplicate:id=>{const task=get().tasks.find(t=>t.id===id);if(task)get().addTask({...task,id:uid(),title:`${task.title.slice(0,293)} (copy)`,completed:false,status:'todo',completedAt:null,createdAt:Date.now(),subtasks:task.subtasks.map(s=>({...s,id:uid(),completed:false})),recurringFrom:undefined});},
  deleteTasks:ids=>{const removed=get().tasks.filter(t=>ids.includes(t.id));get().save({tasks:get().tasks.filter(t=>!ids.includes(t.id))},{message:`${removed.length} task${removed.length===1?'':'s'} deleted`,removed});},
  undo:()=>{const removed=get().toast?.removed;if(removed)get().save({tasks:[...get().tasks,...removed.filter(t=>!get().tasks.some(x=>x.id===t.id))]});set({toast:null});},
  bulk:(ids,changes)=>get().save({tasks:get().tasks.map(t=>ids.includes(t.id)?{...t,...changes}:t)}),
  reorder:(active,over)=>{const tasks=[...get().tasks],from=tasks.findIndex(t=>t.id===active),to=tasks.findIndex(t=>t.id===over);if(from<0||to<0)return;tasks.splice(to,0,tasks.splice(from,1)[0]);get().save({tasks});},
  addProject:(name,color)=>{const id=uid();get().save({projects:[...get().projects,{id,name:name.trim(),color}]});return id;},
  updateSettings:changes=>get().save({settings:{...get().settings,...changes}}),
  importData:data=>get().save(validateWorkspace(data),{message:'Workspace imported successfully.'}),
  resetDemo:()=>get().save(demoWorkspace(),{message:'A fresh demo workspace is ready.'}),
  notify:message=>set({toast:{message}}), dismiss:()=>set({toast:null}),
}));
