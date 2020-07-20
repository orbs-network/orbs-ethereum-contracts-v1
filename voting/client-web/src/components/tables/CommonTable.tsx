import React, { PropsWithChildren, useCallback, useMemo } from 'react';
import MaterialTable, { Components, MaterialTableProps, MTableBody, Options } from 'material-table';
import TableFooter from '@material-ui/core/TableFooter';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import { TABLE_ICONS } from './TableIcons';

interface IProps {}
const typedMemo: <T>(c: T) => T = React.memo;

const a = <RowData extends object>(props: IProps & MaterialTableProps<RowData>) => {
  return <div>Stam</div>;
};

const MemA = typedMemo(a);

/**
 * The table used throughout the app.
 */
export const CommonTableImp = <RowData extends object>(props: IProps & MaterialTableProps<RowData>) => {
  const { columns, data, components, options, ...others } = props;
  const renderNotContainer = useCallback((containerProps: PropsWithChildren<any>) => containerProps.children, []);

  const componentsOverride: Components = useMemo(
    () => ({
      //  DEV_NOTE : Remove 'Paper'
      Container: renderNotContainer,
      // Adds all of the other components override
      ...components,
    }),
    [renderNotContainer, components],
  );

  const tableStyle: React.CSSProperties = useMemo(() => ({ backgroundColor: 'rgba(0,0,0, 0)' }), []);
  const bareTableOptions: Options<RowData> = useMemo(
    () => ({
      headerStyle: {
        backgroundColor: 'rgba(0,0,0,0)',
      },
      search: false,
      showTitle: false,
      paging: false,
      ...options,
    }),
    [options],
  );

  return (
    <MaterialTable
      components={componentsOverride}
      style={tableStyle}
      icons={TABLE_ICONS}
      columns={columns}
      data={data}
      options={bareTableOptions}
      {...others}
    />
  );
};

export const CommonTable = typedMemo(CommonTableImp);
