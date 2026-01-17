import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"


const Homepage = () => {
  const [params]=useSearchParams();
 useEffect(()=>{
    const token=params.get("token");
    localStorage.setItem("access_token",token);
 },[])
  return (
    <div className="text-xl">
         This is Homepage
    </div>
  )
}

export default Homepage
