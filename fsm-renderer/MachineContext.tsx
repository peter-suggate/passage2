import styles from "./Nodes.module.css";

type Props<Context> = {
  context: Context;
};

const Item = () => {};

const CollectionItem = ({ items }: { items: string[] }) => {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
};

const StringItem = ({ value }: { value: string | undefined }) => {
  return <span>{value === undefined ? "<empty>" : value}</span>;
};

const PropertyValue = ({ value }: { value: any }) => {
  switch (typeof value) {
    case "object": {
      if (Array.isArray(value)) {
        return <CollectionItem items={value} />;
      }
    }
    case "undefined":
    case "string": {
      return <StringItem value={value} />;
    }
    default:
      return <div>Unsupported context value type: {typeof value}.</div>;
  }
};

const Property = ({ name, value }: { name: string; value: any }) => {
  return (
    <div>
      <div>{name}:</div>
      <PropertyValue value={value} />
    </div>
  );
};

export const MachineContext = <Context extends {}>({
  context,
}: Props<Context>) => {
  return (
    <div className={styles.context}>
      {Object.entries(context).map((entry) => {
        const key = entry[0];
        const value = entry[1];
        return <Property key={key} name={key} value={value} />;
      })}
    </div>
  );
};
