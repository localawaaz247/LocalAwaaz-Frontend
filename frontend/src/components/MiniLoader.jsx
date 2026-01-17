const MiniLoader = ({ className = "" }) => {
  return (
    <div
      className={` justify-center items-center inline-block rounded-full 
      border-2 border-white border-t-teal-500  
      animate-spin ${className}`}
    />
  );
};

export default MiniLoader;
