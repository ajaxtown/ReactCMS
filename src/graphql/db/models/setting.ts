import { DataTypes, Model, Optional } from "sequelize";

import { Author } from "./author";
import { Image, Navigation, NavigationType } from "@/__generated__/__types__";

export interface SettingAttributes {
  id: number;
  site_title: string;
  site_tagline: string;
  site_email: string;
  site_url: string;
  site_footer: string;
  site_description: string;
  subscribe_embed: string;
  social_twitter: string;
  social_facebook: string;
  social_instagram: string;
  social_github: string;
  displayAuthorInfo: boolean;
  cloudinary_key: string;
  cloudinary_name: string;
  cloudinary_secret: string;
  menu: Navigation[];
  css: string;
  google_analytics: string;
  theme: string;
  disqus_id: string;
  banner: Image;
  site_logo: Image;
  site_favicon: Image;
  client_token: string;
  ping_url: string;
}

export interface SettingCreationAttributes
  extends Optional<SettingAttributes, "id"> {}

export class Setting
  extends Model<SettingAttributes, SettingCreationAttributes>
  implements SettingAttributes
{
  public id!: number;
  public site_title!: string;
  public site_tagline!: string;
  public site_email!: string;
  public site_url!: string;
  public site_footer!: string;
  public site_description!: string;
  public subscribe_embed!: string;
  public social_twitter!: string;
  public social_facebook!: string;
  public social_instagram!: string;
  public social_github!: string;
  public displayAuthorInfo!: boolean;
  public cloudinary_key!: string;
  public cloudinary_name!: string;
  public cloudinary_secret!: string;
  public menu!: Navigation[];
  public css!: string;
  public google_analytics!: string;
  public theme!: string;
  public disqus_id!: string;
  public banner!: Image;
  public site_logo!: Image;
  public site_favicon!: Image;
  public client_token!: string;
  public ping_url!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  constructor(...args) {
    super(...args);
  }
}

export default function initSetting(sequelize) {
  Setting.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      site_title: {
        type: DataTypes.STRING(100),
        defaultValue: "",
      },
      site_tagline: {
        type: DataTypes.STRING(160),
        defaultValue: "",
      },
      site_email: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      site_url: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      site_footer: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      site_description: {
        type: DataTypes.STRING(500),
        defaultValue: "",
      },
      subscribe_embed: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      social_twitter: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      social_facebook: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      social_instagram: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      social_github: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      displayAuthorInfo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      cloudinary_key: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      cloudinary_name: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      cloudinary_secret: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      menu: {
        type: DataTypes.JSON,
      },
      css: {
        type: DataTypes.TEXT,
        defaultValue: "",
      },
      google_analytics: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      theme: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      client_token: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      disqus_id: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      banner: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      site_logo: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      site_favicon: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      ping_url: {
        type: DataTypes.STRING(200),
        defaultValue: "",
      },
    },
    {
      tableName: "settings",
      sequelize, // passing the `sequelize` instance is required
    },
  );

  return Setting;
}

export function associateSetting(): void {
  Setting.belongsTo(Author, {
    foreignKey: "setting_id",
  });
}

const menu = [
  {
    label: "home",
    original_name: "home",
    slug: "home",
    type: NavigationType.Tag,
  },
  {
    label: "Page",
    original_name: "Page",
    slug: "letterpad-typography",
    type: NavigationType.Page,
  },
];

export const settingsData = {
  site_title: "Letterpad",
  site_tagline: "Compose a story",
  site_email: "admin@letterpad.app",
  site_url: "https://demo.letterpad.app",
  site_footer: "",
  site_description: "",
  subscribe_embed: "",
  social_twitter: "",
  social_facebook: "",
  social_instagram: "",
  social_github: "",
  displayAuthorInfo: true,
  site_logo: {
    src: "/uploads/logo.png",
    width: 200,
    height: 200,
  },
  site_favicon: {
    src: "/uploads/logo.png",
    width: 200,
    height: 200,
  },
  css: "",
  google_analytics: "UA-120251616-1",
  theme: "hugo",
  disqus_id: "",
  menu: menu,
  cloudinary_key: "",
  cloudinary_name: "",
  cloudinary_secret: "",
  client_token: "",
  banner: {
    src: "https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2850&q=80",
    width: 1502,
    height: 900,
  },
  ping_url: "",
};
