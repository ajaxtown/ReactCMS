import { device } from "./../devices";
import styled from "styled-components";

const defaultStyles = `
    background: var(--bg-base);
    color: var(--color-base);

    a {
        color: var(--color-base);
        transition: all 0.125s cubic-bezier(0.3, 0.1, 0.58, 1);
        text-decoration: none;
    }
    
    a:hover,
    a:focus {
        text-decoration: none;
        outline: none;
    }
    a:hover {
        color: var(--link-hover);
    }

    ::-webkit-input-placeholder {
        color: var(--color-muted) !important;
        font-weight: 300;
    }

    
    hr {
        border-top: 1px solid var(--color-border);
    }
`;

export const Layout = styled.div<any>`
  display: flex;
  flex-direction: row;
  ${defaultStyles}
  main {
    margin-left: 290px;
    z-index: 1;
    width: 100%;
    min-height: 100vh;
    height: calc(100%);
    .content-area {
      max-width: 1200px;
      margin: auto;
    }
  }
  .sidebar {
    z-index: 3;
    transition: 0.2s cubic-bezier(0.075, 0.82, 0.165, 1) transform;
  }

  @media ${device.tablet} {
    main {
      margin-left: 0px;
    }
    .sidebar {
      transform: translateX(-390px);
      .sidebar-header {
        display: none;
      }
      .custom-menu {
        height: calc(100vh - 100px);
      }
    }
  }

  ${p => p.sidebarOpen && showSidebar()}
`;

function showSidebar() {
  return `
  .sidebar {
    transform: translateX(0px);
  }
`;
}

export const MobileMenu = styled.div`
  border-top: 1px solid var(--color-border);
  width: 100vw;
  position: fixed;
  bottom: 0px;
  background: var(--bg-base);
  padding: 16px;
  z-index: 2;
  justify-content: space-between;
  display: none;
  button {
    border: none;
    cursor: pointer;
    background: transparent;
    i {
      font-size: 1.3rem;
    }
  }

  @media ${device.tablet} {
    display: flex;
  }
`;

export const BackFade = styled.div`
  background: #000;
  opacity: 0.6;
  width: 100vw;
  height: 100vh;
  position: absolute;
  left: 0px;
  top: 0px;
  z-index: 2;
  cursor: pointer;
`;
