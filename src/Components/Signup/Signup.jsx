import { useState,useContext} from "react"
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Database_Context } from "../../App";
import { useAuthState } from "react-firebase-hooks/auth";


function Signup() {
	let [Name, setName]=useState("");
	let [Email, setEmail]=useState("");
	let [Password, setPassword]=useState("");
	let [ConfirmPassword, setConfirmPassword]=useState("");
	let [ErrorLog,setErrorLog]=useState("");
	let [Signingup , setSigningup]=useState(false);
	let {auth,firestore} =useContext(Database_Context);
	let [SignedInUser,Loading] =useAuthState(auth); 
	let navigate = useNavigate();

    function NameChecker(){
		if(Name==="")
		{
			setErrorLog("Name Cannot be Empty");
			return false;
		}else if(Name.length<=3){
			setErrorLog("Name Should be atleast 4 characters long");
			return false;
		} else{
			setErrorLog("");
			return true
		}
    }
    function EmailChecker(){
		if(Email==="")
		{
			setErrorLog("Email Cannot be Empty");
			return false;
		}else{
			setErrorLog("");
			return true
		}
    }
    function PasswordChecker(){
		if(Password==="")
		{
			setErrorLog("Password Cannot be Empty");
			return false;
		}else if(Password.length < 8){
			setErrorLog("Password Should be atleast 8 characters long");
			return false;
		}else{
			setErrorLog("");
			return true
		}
    }
    function ConfirmPasswordChecker(){
		if(ConfirmPassword==="")
		{
			setErrorLog("Confirm Password Cannot be Empty");
			return false;
		}else if(Password !== ConfirmPassword){
			setErrorLog("Password and Confirm Password should be same");
			return false;
		}else{
			setErrorLog("");
			return true;
		}
    }
    function HandleSubmit(e)
    {
		e.preventDefault();
		setSigningup(true);
		if(NameChecker() && EmailChecker() && PasswordChecker() && ConfirmPasswordChecker())
		{
			createUserWithEmailAndPassword(auth,Email,Password)
			.then((userCredential)=>{
			const user = userCredential.user;
			updateProfile(user , { displayName : Name,photoURL: "https://t3.ftcdn.net/jpg/05/16/27/58/360_F_516275801_f3Fsp17x6HQK0xQgDQEELoTuERO4SsWV.jpg" })
			.then(()=>{
				firestore.collection("Users").add({
				UID:user.uid,
				Name:user.displayName,
				Email:user.email,
				photoUrl:"https://t3.ftcdn.net/jpg/05/16/27/58/360_F_516275801_f3Fsp17x6HQK0xQgDQEELoTuERO4SsWV.jpg",
				Friends:[],
				Sent_Invites:[],
				Recieved_Invites:[]
				}).then(()=>{
					
				}).catch((Error)=>{
					console.log(Error);
				})
				navigate("/");
			}).catch(error=>{
				console.log(error);
			})
			}).catch((Error)=>{
				if(Error.code==="auth/email-already-in-use")
				{
				setErrorLog("Email already in use");
				alert("Email already in use");
				setSigningup(false);
				}else{
				alert("Something went wrong. Please reload the page and try again.");
				console.log(Error.message);
				setSigningup(false);
				}
			})
		}else{
			setSigningup(false);
		}
    }
    return (
        <>
            { !Loading && SignedInUser ? navigate("/") :
            <section className="bg-slate-500 h-screen flex justify-center items-center">
                <div className="flex h-full md:h-[600px] md:w-[480px] w-full flex-col justify-center px-6 py-12 lg:px-8 bg-slate-700 rounded-md">
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-200">Create Account </h2>
                </div>
                <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form onSubmit={HandleSubmit} className="space-y-6" action="#" method="POST">
                      <div>
                          <label htmlFor="Name" className="block text-sm font-medium leading-6 text-gray-200">Name</label>
                          <div className="mt-2">
                            <input
                                value={Name}
                                onChange={(e)=>{setName(e.target.value)}}
                                onBlur={NameChecker}
                                id="Name" name="Name" type="text" autoComplete="text" required className="px-4 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"/>
                          </div>
                      </div>
                      <div>
                          <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-200">Email address</label>
                          <div className="mt-2">
                            <input
                                value={Email}
                                onChange={(e)=>{setEmail(e.target.value)}}
                                onBlur={EmailChecker}
                                id="email" name="email" type="email" autoComplete="email" required className="px-4 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"/>
                          </div>
                      </div>
                      <div>
                          <div className="flex items-center justify-between">
                          <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-200">Password</label>
                          </div>
                          <div className="mt-2">
                            <input
                                value={Password}
                                onChange={(e)=>{setPassword(e.target.value)}}
                                onBlur={PasswordChecker}
                                id="password" name="password" type="password" autoComplete="current-password" required className="px-4 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                          </div>
                      </div>
                      
                      <div>
                          <label htmlFor="Confirm_Password" className="block text-sm font-medium leading-6 text-gray-200">Confirm Password</label>
                          <div className="mt-2">
                            <input
                                value={ConfirmPassword}
                                onChange={(e)=>{setConfirmPassword(e.target.value)}}
                                onBlur={ConfirmPasswordChecker}
                                id="Confirm_Password" name="Confirm_Password" type="password" required className="px-4 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"/>
                          </div>
                      </div>

                      <span className="text-red-600 h-2 flex items-center justify-center">{ErrorLog}</span>
                    <div>
                        {Signingup? 
                        <div className="flex items-center justify-center w-full border rounded-lg  bg-gray-800 border-gray-700">
                            <div role="status">
                                <svg aria-hidden="true" className=" py-1 w-8 h-10  animate-spin text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/></svg>
                                <span className="sr-only">Loading...</span>
                            </div>
                        </div>
                        : <button type="submit" className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Sign up
                        </button> 

                        }
                        <p className="w-full text-center mt-3 text-white text-sm" >Already have account  
                          <a href="#" onClick={()=>navigate("/")} className=" pl-2 text-md font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer">Sign-in </a>
                        </p>
                    </div>
                    </form>
                </div>
                </div>
            </section>
            }
        </>
  )
}

export default Signup