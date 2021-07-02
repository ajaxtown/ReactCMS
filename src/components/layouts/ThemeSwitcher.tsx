import { Switch } from "antd";
import { useEffect, useState } from "react";

const ThemeSwitcher = () => {
  const [theme, setTheme] = useState(localStorage.theme || "light");

  useEffect(() => {
    if (localStorage.theme) {
      setTheme(localStorage.theme);
    }
    setTimeout(() => {
      switchTheme(localStorage.theme || theme);
    }, 0);
  }, []);

  const switchTheme = (color: string) => {
    ThemeSwitcher.switch(color);
    setTheme(color);
  };

  return (
    <div style={{ position: "absolute", bottom: "0px", padding: "20px" }}>
      <Switch
        checkedChildren="🔆"
        unCheckedChildren="☽"
        checked={theme === "dark"}
        size="small"
        onChange={(checked) => switchTheme(checked ? "dark" : "light")}
      />
    </div>
  );
};

ThemeSwitcher.switch = (color) => {
  const $body = document.body;
  let stylePath = "/css/antd.css";
  if (color === "dark") {
    stylePath = "/css/antd.dark.css";
    $body.classList.remove("light");
    $body.classList.add("dark");
  } else {
    $body.classList.remove("dark");
    $body.classList.add("light");
  }
  const $style = document.querySelector("#theme");
  if ($style) {
    $style.setAttribute("href", process.env.basePath + stylePath);
  }

  localStorage.theme = color;
};
export default ThemeSwitcher;
