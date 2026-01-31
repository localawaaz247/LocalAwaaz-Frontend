import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"


const Homepage = () => {
  return (
    <div className="flex h-screen w-screen bg-background">
      <Sidebar/>
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}

export default Homepage
