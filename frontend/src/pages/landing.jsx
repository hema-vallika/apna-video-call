import React from 'react';
import { Link, useNavigate } from 'react-router-dom';



export default function LandingPage() {
  const router = useNavigate()



  const handleToggleMenu = () => {

  }


  return (
    <div className="landingContainer">
      <nav>
        <div className='navHeader'>
          <h2>Apna Video Call</h2>
        </div>
        <div className='navlist'>
          <p onClick={() => {
            router("/algftydg")
          }}>Join as Guest</p>
          <p onClick={() => {
              router("/auth")
            }}>Register</p>
          <div role='button'>
            <p onClick={() => {
              router("/auth")
            }}>Login</p>
          </div>
        </div>

        <div className='menuIcon' onClick={handleToggleMenu}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </nav>
      <main className="landingMainContainer">
        <div className='main_left'>
          <h1><span style={{color: "#FF9839"}}>Connect</span> with your loved ones</h1>
          <p>Cover a distance by Apna Video Call</p>
          <div className='getStartedButton'>
            <Link to={"/auth"}>Get Started</Link>
          </div>
          
        </div>

        <div className='main_right' >
          <img src="/mobile-transformed.png" alt="" style={{
            width: "100%",
          }}  />
        </div>
      </main>

    </div>
  )
}

