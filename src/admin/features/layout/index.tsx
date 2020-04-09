import { BackFade, Layout, MobileMenu } from "./Layout.css";
import React, { useEffect, useState } from "react";

import { Link } from "react-router-dom";
import Search from "../search/index";
import Sidebar from "../sidebar";
import { deviceSize } from "../devices";

export const TwoColumnLayout = ({ children, settings, router }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    window.addEventListener("resize", () => {
      if (document.body.clientWidth < parseInt(deviceSize.tablet)) {
        setSidebarOpen(false);
      }
    });
  }, []);

  const sidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
  }, [sidebarOpen]);

  return (
    <>
      {/* <Search onClose={() => {}} /> */}
      <Layout className={` theme-light`} sidebarOpen={sidebarOpen}>
        <div className="sidebar">
          <Sidebar settings={settings} router={router} />
        </div>
        {sidebarOpen && <BackFade onClick={sidebarToggle} />}
        <main>
          <div className="content-area">{children}</div>
        </main>
        <MobileMenu>
          <Link to="#">
            <img src={settings.site_logo.value} height="20" />
          </Link>
          <button onClick={sidebarToggle}>
            <i className="fa fa-search"></i>
          </button>
          <button onClick={sidebarToggle}>
            <i className={`fa fa-${sidebarOpen ? "times" : "bars"}`}></i>
          </button>
        </MobileMenu>
      </Layout>
      <div id="portal-root"></div>
    </>
  );
};
