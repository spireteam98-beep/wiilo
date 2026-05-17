import React from 'react'

function page() {
  return (
    <div>
        

        <header className="component navigation homepage-nav" data-section-name="">
  <h1 className="visually-hidden">
    TIME | Current &amp; Breaking News | National &amp; World Updates
  </h1>
  <nav className="main can-animate">
    <div className="container above">
      <div className="container-inner flex-end">
  
          Sign Up for Our Newsletter{" "}
     
        
      </div>
      <div className="container-inner">
        <div className="logo">
         
        </div>
      </div>
      <div className="container-inner flex-center">
        <div className="button-group">

            Subscribe
        
        </div>
      </div>
    </div>{" "}
    <div className="container primary">
      <div className="container-inner left">
        <button
          id="button-in-unless"
          className="menu-btn"
          title="Menu"
          aria-label="Menu"
        >
          <div className="menu-btn-box">
            <div className="menu-btn-inner" />
          </div>
        </button>
        <div className="logo" id="">
  
        </div>
      </div>
      <div className="container-inner right">
        <div className="primary-links hidden" data-tracking-zone="nav">
         
        </div>
        <div className="featured-links desktop-only">
          <ul>
            <li className="newsletter">
              <a
                href=""
                target="_blank"
              >
               
                Sign Up for Our Ideas Newsletter POV
              </a>
            </li>
          </ul>
        </div>
        <div className="buttons " data-tracking-zone="search">
          <button
            className="icon search js-activate"
            data-action="primary-nav-pos-1"
            title="Search"
            aria-label="Search"
          >
            <span className="icon icon-search utility-icon color-ribbon-primary-text ">
        
            </span>
          </button>
          <button className="icon search mobile-only">
            <span className="icon icon-search utility-icon color-ribbon-primary-text ">
         
            </span>
          </button>
         
         
          
        </div>
      </div>
    </div>
  </nav>
  <div className="nav-placeholder"></div>
  <nav data-tracking-zone="nav" className="menu can-animate">
    <section className="container">
      <div className="account-mobile hidden">
        <div className="button-container">
          <button className="subscribe">
            <a
              rel="nofollow"
              className="subscribe-link"
              href="/subscribe-hamburger-time"
              data-location="hamburger button"
            >
              Subscribe
            </a>
          </button>
        </div>
      </div>
      <section className="menu-section">
        <label className="menu-label">Sections</label>
     
      </section>
   
      
    </section>
  </nav>

</header>


        
    </div>
  )
}

export default page