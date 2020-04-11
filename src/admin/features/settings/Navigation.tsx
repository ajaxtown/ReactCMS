import { Container, Grid } from "./navigation/Navigation.css";
import React, { useState } from "react";
import { Setting, SettingOptions } from "../../../__generated__/gqlTypes";
import { SortableContainer, arrayMove } from "react-sortable-hoc";
import { WithNamespaces, translate } from "react-i18next";

import { Button } from "../../components/button";
import { IMenu } from "../../../client/types";
import SortableItem from "./navigation/SortableItem";
import { UPDATE_OPTIONS } from "../../../shared/queries/Mutations";
import apolloClient from "../../../shared/apolloClient";
import { useNavigationData } from "./navigation/data.hook";

interface IMenuWithError extends IMenu {
  hasError?: boolean;
}
interface INavigationBuilderProps extends WithNamespaces {
  settings: { [option in SettingOptions]: Setting };
}

const Navigation: React.FC<INavigationBuilderProps> = ({ settings, t }) => {
  const { data, loading } = useNavigationData();
  const [menu, setMenu] = useState<IMenuWithError[]>([
    ...addIds(normalizeSlugs(JSON.parse(settings.menu.value))),
  ]);
  if (loading) return null;

  const onSortEnd = async ({ oldIndex, newIndex }) => {
    const newOrder = arrayMove(menu, oldIndex, newIndex);
    setMenu(newOrder);
    await save(settings.menu.option, newOrder);
  };

  const generareId = () => {
    const ids = menu.map(item => item.id);
    const id = Math.max.apply(null, ids);

    return id + 1;
  };

  const addNewRow = () => {
    const newItem = {
      id: generareId(),
      title: "",
      slug: "",
      type: "",
      originalName: "",
    };
    setMenu([...menu, newItem]);
  };

  const onChange = async (index: number, change: IMenuWithError) => {
    let newMenu = [...menu];
    newMenu[index] = change;
    setMenu(newMenu);

    await save(settings.menu.option, newMenu);
  };

  const onRemove = async index => {
    if (menu.length === 1) {
      return alert("Navigation menu cannot be empty");
    }
    const newMenu = [...menu];
    newMenu.splice(index, 1);
    setMenu(newMenu);
    await save(settings.menu.option, newMenu);
  };

  return (
    <Container>
      <Grid>
        <span />
        <strong>Label</strong>
        <strong>Path</strong>
        <span />
      </Grid>
      <br />
      <div>
        <SortableList
          items={menu}
          onSortEnd={onSortEnd}
          source={data}
          onChange={onChange}
          onRemove={onRemove}
          hideSortableGhost={false}
          lockAxis="y"
          lockToContainerEdges={true}
          shouldCancelStart={e => {
            //@ts-ignore
            return !e.target.classList.contains("dragger");
          }}
        />
      </div>
      <Button btnSize="md" btnStyle="primary" onClick={addNewRow}>
        New
      </Button>
    </Container>
  );
};

export default translate("translations")(Navigation);

const SortableList = SortableContainer(
  ({ items, source, onChange, onRemove }) => {
    return (
      <div>
        {items.map((value, index) => (
          <SortableItem
            key={value.id}
            index={index}
            value={value}
            source={source}
            onChange={change => onChange(index, change)}
            onRemove={e => {
              e.preventDefault();
              onRemove(index);
            }}
          />
        ))}
      </div>
    );
  },
);

function normalizeSlugs(menu) {
  return menu.map((item, idx) => {
    item.slug = item.slug
      .replace("/category/", "")
      .replace("/tag/", "")
      .replace("/posts/", "")
      .replace("/page/", "");
    item.id = idx;
    return item;
  });
}

function prepareForBackend(newMenu) {
  return newMenu.map(item => {
    delete item.hasError;
    delete item.id;
    return item;
  });
}

async function save(option, value) {
  const errors = value.filter(item => item.hasError);
  if (errors.length > 0) {
    return;
  }
  const cleanMenu = prepareForBackend(JSON.parse(JSON.stringify(value)));

  await apolloClient(true).mutate({
    mutation: UPDATE_OPTIONS,
    variables: {
      options: [
        {
          option: option,
          value: JSON.stringify(cleanMenu),
        },
      ],
    },
  });
}

function addIds(arr) {
  return arr.map((item, idx) => {
    item.id = idx;
    return item;
  });
}