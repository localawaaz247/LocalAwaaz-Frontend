
import { login, register } from "../reducer/authReducer";
import {showToast} from "../utils/toast"



export  default async function authAction (prevState,formData,dispatch,navigate){
    
    const mode=formData.get("mode");
    if(mode === "login"){
        const identifier=formData.get("userName");
        const password=formData.get("password");
        if(!identifier || !password){
            return {success:false,message:"Both fields are required"}
        }
         const result=await dispatch(login({identifier,password}));

      if (login.rejected.match(result)) {
        showToast({icon:"error",title:result.payload.message});
      return { error: result.payload };
     }
    
       navigate("/homepage");
       showToast({icon:"success",title:"Login Successfull!"})
  
  return { success: true};
      
    } else{
         const data=Object.fromEntries(formData.entries());
           const {name,userName,email,password,country,city,state,gender,pinCode}=data;
         const result=await dispatch(register({name,userName,email,password,country,city,state,pinCode,gender}));
         if(register.rejected.match(result)){
           showToast({icon:"error",title:result.payload.message})
          return {error: result.payload}
         }
           showToast({icon:"success",title:"SignUp Successfull!"})
        return {success:true};
    }

    }

 
