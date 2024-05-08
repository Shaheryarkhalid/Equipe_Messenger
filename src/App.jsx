import { createContext, useEffect,useState } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import {Nav_Bar, Connect, Teams, Signin, Signup, Loader, P404, Incoming_Call, Audio_Call, Video_Call } from "./Components"
import firebase from "firebase/compat/app"
import 'firebase/compat/firestore'
import 'firebase/compat/auth'
import 'firebase/compat/storage'
import {useAuthState} from 'react-firebase-hooks/auth'

firebase.initializeApp({
  apiKey: import.meta.env.VITE_apiKey,
  authDomain: import.meta.env.VITE_authDomain,
  projectId: import.meta.env.VITE_projectId,
  storageBucket: import.meta.env.VITE_storageBucket,
  messagingSenderId: import.meta.env.VITE_messagingSenderId,
  appId: import.meta.env.VITE_appId,
  measurementId: import.meta.env.VITE_measurementId
})

const auth=firebase.auth();
const firestore =firebase.firestore();
const StorageBuck=firebase.storage();

const Database_Context=createContext();
const View_Context=createContext();
function App() {
  let [SignedInUser,Loading] =useAuthState(auth); 
  let [Incoming,set_Incoming]=useState(false);
  let [Caller,set_Caller]=useState(null);
  let [Call_Data, set_Call_Data]=useState(null);
  let [Left_Drawer,set_Left_Drawer]=useState(false);

  auth.currentUser && console.log(auth.currentUser.uid);
  useEffect(()=>{
    auth.currentUser && firestore.collection("Calls").where("Reciever_ID","==", auth.currentUser.uid).where("Answered","==",false).where("Rejected","==",false).get().then((Call_Doc)=>{
      Call_Doc.docs && Call_Doc.docs.map((doc)=>{
          if(Date.now() - (doc.data().Created_At.seconds * 1000) > 60000)
          {
            firestore.collection("Calls").doc(doc.id).delete();
          }else{
            if(!doc.data().Answered)
            {
              firestore.collection("Users").where("UID","==",doc.data().Caller_ID).get().then((usr)=>{
                set_Call_Data(doc);
                set_Incoming(true);
                set_Caller(usr.docs[0].data());
              });
              
            }
          }
        })  
    })
    auth.currentUser && firestore.collection("Calls").where("Reciever_ID","==", auth.currentUser.uid).where("Answered","==",false).where("Rejected","==",false).onSnapshot((Call_Doc)=>{
      Call_Doc.docs && Call_Doc.docs.map((doc)=>{
          if(Date.now() - (doc.data().Created_At.seconds * 1000) > 300000)
          {
            firestore.collection("Calls").doc(doc.id).delete();
          }else{
            if(!doc.data().Answered)
            {
              firestore.collection("Users").where("UID","==",doc.data().Caller_ID).get().then((usr)=>{
                set_Call_Data(doc);
                set_Incoming(true);
                set_Caller(usr.docs[0].data());
              });
            }
          }
      })
    })
  })
  return (
    <section className=" h-[100svh] relative" onClick={()=>{document.getElementById("Incoming_Call").play()}}>
      <BrowserRouter>
        <View_Context.Provider value={{Left_Drawer,set_Left_Drawer}}>
          <Database_Context.Provider value={{auth,firestore,StorageBuck}}>
            {
              Incoming && Caller &&
                <div className="absolute bottom-32 right-36 z-50">
                  <Incoming_Call Caller={Caller} set_Incoming={set_Incoming} set_Caller={set_Caller} Call_Data={Call_Data}/>
                </div>
            }
            {Loading&&
              <Loader />
            }
        
            <Routes>
              {!Loading && !SignedInUser&& 
                <>
                  <Route path='*' element={<P404 />}/>
                  <Route path="/" element={<Signin/>} />
                  <Route path="/Signup" element={<Signup/>} />
                </>
              }
              { !Loading && SignedInUser &&
                ( 
                  <>
                    <Route path="/Video_Call" element={<Video_Call/>} />
                    <Route path="/Voice_Call" element={<Audio_Call/>} />
                    <Route
                    path="*"
                    element={
                      <>
                          <Nav_Bar />
                          <div className="h-[calc(100vh-96px)] w-full overflow-auto">
                            <Routes>
                              <Route path="/" element={<Connect />} />
                              <Route path="/Teams" element={<Teams />} />
                              <Route path='*' element={<P404 />}/>
                            </Routes>
                          </div>
                        </>
                      } />
                  </>
                )
              }
            </Routes>
          </Database_Context.Provider>
        </View_Context.Provider>
      </BrowserRouter>
      <audio id="Incoming_Call" controls muted loop className=" w-0 h-0 absolute -z-50">
          <source src="src/assets/InComing_Call.m4a"  />
      </audio>  
    </section>
  )
}
export default App
export {Database_Context,View_Context}