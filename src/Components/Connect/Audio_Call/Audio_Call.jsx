import {useContext, useEffect, useRef, useState } from "react";
import { Database_Context } from "../../../App";
import firebase from "firebase/compat/app";
import { v4 } from "uuid";


function Audio_Call() {
	let [Call,set_Call]=useState();
    let [Reciever,set_Reciever]=useState();
    let [Reciever_Profile,set_Reciever_Profile]=useState();
    let [Call_Recieved,set_Call_Recieved]=useState();
    let [Call_Snap,set_Call_Snap]=useState(null);
    let Remote_Stream_Box =useRef();
    let [Call_Status,set_Call_Status]= useState("Calling");
    let {auth,firestore}=useContext(Database_Context);
    const Url = window.location.search;
    let Remote_Stream=new MediaStream();
    const Args = new URLSearchParams(Url);
    const server={
      iceServers: [
        {
          urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
      ],
      iceCandidatePoolSize: 10,
    }
    let Peer_Connection = new RTCPeerConnection(server);
    
    useEffect(()=>{
      if(Args.get("Target"))
      {
        set_Reciever(Args.get("Target"))
        if(Args.get("Accept"))
        {
          set_Call_Recieved(Args.get("Accept"));
        }
      }
    },[])
    useEffect(()=>{
        Reciever && firestore.collection("Users").where("UID","==",Reciever).get().then((Snap)=>{
            Snap.docs[0] && set_Reciever_Profile(Snap.docs[0].data());
        })
    },[Reciever])
  
    useEffect(()=>{
      !Call_Recieved && Reciever && Make_Call();
    },[Reciever])
  
    useEffect(()=>{
      Call_Recieved && Reciever && Call && Accept_Call();
    },[Reciever,Call_Recieved,Call])
  
    useEffect(()=>{
      let x=Args.get("Call");
      x &&  firestore.collection("Calls").where("Call_ID","==",x).get().then((Call_Doc)=>{
          if(Call_Doc.docs[0])
          {
            set_Call(Call_Doc.docs[0]);
            set_Call_Snap(Call_Doc.docs[0].id);
          }else{
            alert("Args.call");
            window.close();
          }
      })
    },[Args.get("Call")])
  
    useEffect(()=>{
      Call_Snap && firestore.collection("Calls").doc(Call_Snap).onSnapshot({ includeMetadataChanges: true }, (Snap) => { (!Snap.exists) &&  window.close()});
    },[Call_Snap])

    function Call_Timer()
    {
      let Timer=0;
      let Minutes;
      let Hour;
      setInterval(() => {
        Timer++;       
        let Seconds = Timer % 60;
        Seconds = Seconds.toString().padStart(2,0)
        Minutes = Math.floor(Timer / 60);
        Minutes =  Minutes.toString().padStart(2,0); 
        Hour=Math.floor(Minutes / 60);
        Hour =  Hour.toString().padStart(2,0); 
        Hour > 0 ? set_Call_Status( Hour + ":" + Minutes + ":" + Seconds) : set_Call_Status( Minutes + ":" + Seconds) ;
      }, 1000);
    }

    Peer_Connection.ontrack= (event) => {
      event.streams[0].getTracks().forEach((track) =>{ 
        Remote_Stream.addTrack(track);
        if(Remote_Stream_Box.current)
        {
          Remote_Stream_Box.current.srcObject=Remote_Stream;
        }
      })
    };
    let Added_Stream;
    async function Make_Call()
    {
      let Local_Stream = await navigator.mediaDevices.getUserMedia({audio:true});
      Local_Stream.getTracks().forEach(Track =>{ Added_Stream = Peer_Connection.addTrack(Track,Local_Stream)});
      let Call_ID=v4();
      await firestore.collection("Calls").add({
        Call_ID: Call_ID,
        Caller_ID: auth.currentUser.uid,
        Created_At: firebase.firestore.FieldValue.serverTimestamp(),
        Reciever_ID:Reciever,
        Rejected:false,
        Answered:false,
        Type:"Voice"
      });
      let Call_Doc=await firestore.collection("Calls").where("Call_ID","==",Call_ID).get().then(res=>res.docs[0]);
      set_Call(Call_Doc);
      let Call_End_Timer=setTimeout(Hangup_Call,60000)
      Peer_Connection.onicecandidate= event => event.candidate && Call_Doc.ref.update({Offer_Candidate:event.candidate.toJSON()});
      const offer_Description= await Peer_Connection.createOffer();
      Peer_Connection.setLocalDescription(offer_Description);
      const Offer={
        sdp: offer_Description.sdp,
        type: offer_Description.type
      }
      await Call_Doc.ref.update({Offer:Offer}); 
      firestore.collection("Calls").where("Call_ID","==",Call_ID).onSnapshot(res=>{
        Call_Doc && Call_Doc.id && set_Call_Snap(Call_Doc.id);
        let data=res.docs[0].data();
        if(!Peer_Connection.remoteDescription && data.Answer)
        {
          clearTimeout(Call_End_Timer);
          let Answer_Description= new RTCSessionDescription(data.Answer);
          Peer_Connection.setRemoteDescription(Answer_Description);
          Call_Timer();
        }
        if(data.Answer && data.Answer_Candidate)
        {
          let answer_Candidate=new RTCIceCandidate(data.Answer_Candidate);
          Peer_Connection.addIceCandidate(answer_Candidate);
        }
      });
    }
    async function Accept_Call()
    {
      let Local_Stream = await navigator.mediaDevices.getUserMedia({audio: true});
      Local_Stream.getTracks().forEach(Track => {Added_Stream = Peer_Connection.addTrack(Track,Local_Stream)});
      Peer_Connection.onicecandidate=(event)=> event.candidate && Call.ref.update({Answer_Candidate:event.candidate.toJSON()});
      if(Call.data().Offer)
      {
        let Offer= new RTCSessionDescription(Call.data().Offer)
        Peer_Connection.setRemoteDescription(Offer);
      }
      let Answer_Description = await Peer_Connection.createAnswer();
      Peer_Connection.setLocalDescription(Answer_Description);
      const Answer={
        sdp: Answer_Description.sdp,
        type:  Answer_Description.type
      }
      await Call.ref.update({Answer:Answer});
      if(Call.data().Offer_Candidate)
      {
        let Offer_Candidate= new RTCIceCandidate(Call.data().Offer_Candidate);
        Peer_Connection.addIceCandidate(Offer_Candidate);
        Call_Timer();
      }
    }
    async function Hangup_Call()
    {
      Added_Stream && Peer_Connection.removeTrack(Added_Stream);
      Peer_Connection.close();
      Peer_Connection.onicecandidate=null;
      Peer_Connection.ontrack=null;
      Call && await firestore.collection("Calls").doc(Call.id).delete();
    }
  return (
    <>
      <div className="h-full w-full bg-slate-800 flex items-center justify-center ">
      <div className="h-[95%] w-[95%] bg-slate-900 relative rounded-md" >
          <div className="h-full w-full flex justify-center items-center relative">
              {
                Reciever_Profile && 
                  <div className=" select-none">
                    <div  className="relative mt-2 flex items-center gap-4 py-2 px-4 border-b border-slate-300 rounded-t-lg">
                        <img  alt="avatar"
                            src={Reciever_Profile.photoUrl}
                            className="relative inline-block object-cover object-center w-12 h-12 rounded-lg" />
                            
                        <div className=" relative">
                            <h6 className="block font-sans text-left text-gray-200 antialiased font-semibold leading-relaxed tracking-normal ">
                                {Reciever_Profile.Name}
                            </h6>
                            <p className="block font-sans text-left text-sm antialiased font-normal leading-normal text-gray-400">
                                Web Developer
                            </p>
                        </div>
                    </div>
                    <div className=" mt-3 w-full h-full text-center text-gray-600">{Call_Status}</div>
                  </div>
              }
              <audio
                  autoPlay
                  ref={Remote_Stream_Box}>
              </audio>
          </div>
          <div className=" w-full h-[70px] absolute bottom-0 flex items-center justify-center ">
            <div className=" w-[100px] h-[50px] bg-slate-500 rounded-md flex items-center justify-evenly z-20">
              <div onClick={Hangup_Call} className="fa fa-phone w-[40px] h-[35px] bg-red-500 hover:bg-red-700 rounded-md  text-[15px] text-gray-300 flex items-center justify-center cursor-pointer" ></div>
            </div>
          </div>
      </div>
    </div>
  </>
  )
}

export default Audio_Call