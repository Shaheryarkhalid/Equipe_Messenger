import { Suspense, createContext, useEffect,useState } from "react"
import { BrowserRouter, Routes, Route} from "react-router-dom"
import {Nav_Bar, Connect, Signin, Loader, Responsive_Loader } from "./Components"
import firebase from "firebase/compat/app"
import 'firebase/compat/firestore'
import 'firebase/compat/auth'
import 'firebase/compat/storage'
import {useAuthState} from 'react-firebase-hooks/auth'
import { lazy } from "react"

let Teams = lazy(()=>import("./Components/Teams/Teams"));
let P404 = lazy(()=> import("./Components/404/404"));
let Incoming_Call = lazy(()=> import("./Components/Incoming_Call/Incoming_Call"))
let Audio_Call = lazy(()=> import("./Components/Connect/Audio_Call/Audio_Call"))
let Video_Call = lazy(()=> import("./Components/Connect/Video_Call/Video_Call"))
let Signup = lazy(()=> import("./Components/Signup/Signup"))

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
                 <Suspense fallback={<Responsive_Loader/>}>
                    <Incoming_Call Caller={Caller} set_Incoming={set_Incoming} set_Caller={set_Caller} Call_Data={Call_Data}/>
                  </Suspense>
                </div>
            }
            {Loading &&
              <Loader />
            }
        
            <Routes>
              {!Loading && !SignedInUser&& 
                <>
                  <Route path='*' element={<P404 />}/>
                  <Route path="/Signup" element={<Signup/>} />
                  <Route path="/" element={<Signin/>} />
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
                          <Suspense fallback={<Responsive_Loader/>}>
                            <Routes>
                              <Route path="/" element={<Connect />} />
                              <Route path="/Teams" 
                                element={
                                  <Suspense fallback={<Responsive_Loader />}>
                                    <Teams/>
                                  </Suspense>
                                } />
                              <Route path='*' element={
                                <Suspense fallback={<Responsive_Loader />}>
                                  <P404 />
                                </Suspense>
                                }/>
                            </Routes>
                          </Suspense>
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