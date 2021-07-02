import { MenuOutlined } from "@ant-design/icons";
import { Button, Drawer } from "antd";
import Layout, { Footer } from "antd/lib/layout/layout";
import Sider from "antd/lib/layout/Sider";
import { Setting, Stats } from "@/__generated__/__types__";
import {
  StatsQuery,
  StatsQueryVariables,
  StatsDocument,
} from "@/__generated__/queries/queries.graphql";
import { useEffect, useState } from "react";
import styled from "styled-components";
import Navigation from "./Menu";
import Logo from "../Logo";
import { initializeApollo } from "@/graphql/apollo";
import ThemeSwitcher from "./ThemeSwitcher";
import siteConfig from "config/site.config";
import { useSession } from "next-auth/client";

interface IProps {
  settings: Setting;
  children: any;
}

const CustomLayout = ({ children, settings }: IProps) => {
  // if (typeof window === "undefined") return null;
  const [stats, setStats] = useState<Stats | {}>({});
  const [collapsed, setCollapsed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [user] = useSession();

  useEffect(() => {
    getStats().then((res) => {
      if (res?.__typename === "Stats") {
        setStats(res);
      }
    });
  }, []);

  if (!settings) return null;
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={(_broken) => {
          //
        }}
        onCollapse={(isCollapsed) => {
          setCollapsed(isCollapsed);
          if (!isCollapsed) {
            setVisible(false);
          }
        }}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          zIndex: 9999,
        }}
        width={siteConfig.sidebar_width}
      >
        <Logo src={settings.site_logo.src} />
        <Navigation stats={stats} />
        <ThemeSwitcher />
      </Sider>
      <Layout
        className="site-layout"
        style={{
          marginLeft: collapsed ? 0 : siteConfig.sidebar_width,
        }}
      >
        <nav className="navbar ">
          <StyledDrawer
            placement="left"
            width={200}
            theme="dark"
            onClose={() => setVisible(false)}
            visible={visible}
          >
            <div className="ant-dropdown-menu-dark" style={{ height: "100%" }}>
              <Logo src={settings.site_logo.src} />
              <Navigation stats={stats} />
              <ThemeSwitcher />
            </div>
          </StyledDrawer>
        </nav>

        <div
          style={{
            minHeight: siteConfig.header_height,
            padding: 20,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            {collapsed && !visible && (
              <>
                <img src={settings.site_logo.src} height={40} />
                &nbsp;&nbsp;&nbsp;
                <Button
                  className="menu"
                  type="ghost"
                  icon={<MenuOutlined />}
                  onClick={() => setVisible(true)}
                  size="middle"
                />
              </>
            )}
          </div>
          <div>
            <a href={settings.site_url} target="_blank">
              View Site
            </a>
            &nbsp;&nbsp; •&nbsp;&nbsp;{user?.user?.name}
          </div>
        </div>
        <div style={{ minHeight: "calc(100vh - 152px)" }}>{children}</div>
        <Footer
          style={{
            textAlign: "center",
          }}
        >
          Letterpad <br />
          <small>
            {/* Client Token: <strong>{settings.client_token}</strong> */}
          </small>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default CustomLayout;

async function getStats() {
  const client = await initializeApollo();
  const stats = await client.query<StatsQuery, StatsQueryVariables>({
    query: StatsDocument,
    fetchPolicy: "network-only",
  });

  return stats.data.stats;
}

const StyledDrawer = styled(Drawer)`
  .ant-drawer-body {
    padding: 0px;
  }
`;
