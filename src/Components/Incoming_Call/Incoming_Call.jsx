import "./Incoming_Call.css"
import { useContext, useEffect, useState } from "react";
import { Database_Context } from "../../App";
import Responsive_Loader from "../Loading/Responsive_Loader";
import PropTypes from 'prop-types';  

function Incoming_Call({Caller,set_Caller,set_Incoming,Call_Data}) {
	let [Performing_Action,set_Performing_Action]=useState(false);
	let {firestore}=useContext(Database_Context);
	if(document.getElementById("Incoming_Call"))
	{
		document.getElementById("Incoming_Call").muted=false;
	}
	useEffect(()=>{
		Call_Data.id ? firestore.collection("Calls").doc(Call_Data.id).onSnapshot({ includeMetadataChanges: true }, (Snap) => {(!Snap.exists) && Close_Incomming_Call()}) :  Close_Incomming_Call() ;
	},[])
	function Close_Incomming_Call()
	{
		set_Caller(null);
		set_Incoming(false);
		if(document.getElementById("Incoming_Call"))
		{
		document.getElementById("Incoming_Call").muted=true;
		}
	}
	function Reject_Call()
	{
		set_Performing_Action(true);
		firestore.collection("Calls").where("Call_ID","==",Call_Data.data().Call_ID).get().then((res)=>{
		firestore.collection("Calls").doc(res.docs[0].id).delete().then(()=>{
			set_Caller(null);
			set_Incoming(false);
			if(document.getElementById("Incoming_Call"))
			{
			document.getElementById("Incoming_Call").muted=true;
			}
		});
		});
	}
	function Accept_Call()
	{
		set_Performing_Action(true);
		firestore.collection("Calls").where("Call_ID","==",Call_Data.data().Call_ID).get().then((res)=>{
		res.docs[0].ref.update({Answered:true}).then(()=>{
			set_Caller(null);
			set_Incoming(false);
			if(document.getElementById("Incoming_Call"))
			{
			document.getElementById("Incoming_Call").muted=true;
			}
			const Video_Url="/Video_Call?Accept=true&Target=" + Caller.UID + "&Call=" +Call_Data.data().Call_ID;
			const Voice_Url="/Voice_Call?Accept=true&Target=" + Caller.UID + "&Call=" +Call_Data.data().Call_ID;
			Call_Data.data().Type ? 
				(
				Call_Data.data().Type==="Voice" ?
					window.open(Voice_Url, "_blank", "noreferrer")
				:
					window.open(Video_Url, "_blank", "noreferrer")

				)
			:
			window.open(Video_Url, "_blank", "noreferrer")
		});
		})
	}
  return (
    <>
        <link href='https://fonts.googleapis.com/css?family=Hind:300|Open+Sans+Condensed:300' rel='stylesheet' type='text/css' />
        <div className="card bg-slate-500">
        <div className="header">
            <div className="animation">
            <span className="icon ring">
              <img src={Caller.photoUrl} alt="avatar"
                className="Usr inline-block object-cover object-center w-12 h-12 rounded-lg" />
            </span> 
            <div className="cercle one"></div>
            <div className="cercle two"></div>
            <div className="cercle three"></div>
            </div>
            <p className="phoneNumber">{Caller.Name}</p>
            <p className="calling">Calling</p>
        </div>

        <div className="footer bg-slate-700">
          { !Performing_Action ?
            <>
              <div onClick={Reject_Call} className="bouton raccrocher">
                <span className="icon red"></span>
              </div>
              <a onClick={Accept_Call} className="bouton decrocher bg-green-500">
                <span className="icon green"></span>
              </a>
            </>
            :
            <Responsive_Loader />
          }
        </div>
        </div>
    </>
  )
}
Incoming_Call.propTypes={
	Caller:PropTypes.object,
	set_Caller:PropTypes.func,
	set_Incoming:PropTypes.func,
	Call_Data:PropTypes.object
}
export default Incoming_Call