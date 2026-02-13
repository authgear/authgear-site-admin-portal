import React, { useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ShimmeredDetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
  IDetailsRowProps,
  DetailsRow,
  ColumnActionsMode,
  Dropdown,
  IDropdownOption,
  SearchBox,
  CommandButton,
  Text,
  IconButton,
  IListProps,
} from "@fluentui/react";
import ScreenTitle from "./ScreenTitle";
import { MOCK_TEAMS, type TeamListItem } from "./data/teams";

import styles from "./TeamsScreen.module.css";

function onShouldVirtualize(_: IListProps): boolean {
  return false;
}

/* Single source of truth for column widths - header and content must match */
const COLUMN_WIDTHS = {
  projectName: 260,
  ownerEmail: 240,
  plan: 120,
  createdAt: 280,
} as const;

const PAGE_SIZE = 5;

const SEARCH_BY_OPTIONS: IDropdownOption[] = [
  { key: "projectId", text: "Project ID" },
  { key: "projectName", text: "Project Name" },
  { key: "ownerEmail", text: "Owner Email" },
];

interface ProjectNameCellProps {
  item: TeamListItem;
}

const ProjectNameCell: React.VFC<ProjectNameCellProps> = ({ item }) => {
  return (
    <div className={styles.projectNameCell}>
      <Text className={styles.projectName}>{item.projectName}</Text>
      <Text className={styles.projectId}>{item.projectId}</Text>
    </div>
  );
};

const TeamsScreen: React.VFC = function TeamsScreen() {
  const [loading] = useState(false);
  const [searchBy, setSearchBy] = useState<string>("projectId");
  const [searchText, setSearchText] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  const columns: IColumn[] = useMemo(() => [
    {
      key: "projectName",
      fieldName: "projectName",
      name: "Project name",
      minWidth: COLUMN_WIDTHS.projectName,
      maxWidth: COLUMN_WIDTHS.projectName,
      columnActionsMode: ColumnActionsMode.disabled,
    },
    {
      key: "ownerEmail",
      fieldName: "ownerEmail",
      name: "Owner email",
      minWidth: COLUMN_WIDTHS.ownerEmail,
      maxWidth: COLUMN_WIDTHS.ownerEmail,
      columnActionsMode: ColumnActionsMode.disabled,
      cellClassName: styles.cellAlignLeft,
    },
    {
      key: "plan",
      fieldName: "plan",
      name: "Plan",
      minWidth: COLUMN_WIDTHS.plan,
      maxWidth: COLUMN_WIDTHS.plan,
      columnActionsMode: ColumnActionsMode.disabled,
      cellClassName: styles.cellAlignLeft,
    },
    {
      key: "createdAt",
      fieldName: "createdAt",
      name: "Create at",
      minWidth: COLUMN_WIDTHS.createdAt,
      maxWidth: COLUMN_WIDTHS.createdAt,
      columnActionsMode: ColumnActionsMode.disabled,
    },
  ], []);

  const allItems: TeamListItem[] = useMemo(() => {
    return MOCK_TEAMS;
  }, []);

  const totalItems = allItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedItems = useMemo(
    () =>
      allItems.slice(
        (safePage - 1) * PAGE_SIZE,
        safePage * PAGE_SIZE
      ),
    [allItems, safePage]
  );

  const onFirstPage = useCallback(() => setCurrentPage(1), []);
  const onPrevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1));
  }, []);
  const onNextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  }, [totalPages]);
  const onLastPage = useCallback(() => setCurrentPage(totalPages), [totalPages]);
  const onPageClick = useCallback((page: number) => setCurrentPage(page), []);

  const onRenderRow = useCallback((props?: IDetailsRowProps) => {
    if (props == null) return null;
    const item = props.item as TeamListItem;
    return (
      <Link to={`/teams/${item.projectId}`} className={styles.rowLink}>
        <DetailsRow {...props} />
      </Link>
    );
  }, []);

  const onRenderItemColumn = useCallback(
    (item: TeamListItem, _index?: number, column?: IColumn) => {
      switch (column?.key) {
        case "projectName":
          return <ProjectNameCell item={item} />;
        case "ownerEmail":
          return (
            <div className={styles.cellContentLeft}>
              <Text className={styles.cellText}>{item.ownerEmail}</Text>
            </div>
          );
        case "plan":
          return (
            <div className={styles.cellContentLeft}>
              <Text className={styles.cellText}>{item.plan}</Text>
            </div>
          );
        case "createdAt":
          return <Text className={styles.cellText}>{item.createdAt}</Text>;
        default:
          return null;
      }
    },
    []
  );

  const onSearchByChange = useCallback(
    (_event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
      if (option) {
        setSearchBy(option.key as string);
      }
    },
    []
  );

  const onSearchChange = useCallback(
    (_event?: React.ChangeEvent<HTMLInputElement>, newValue?: string) => {
      setSearchText(newValue || "");
    },
    []
  );

  const onClearFilters = useCallback(() => {
    setSearchText("");
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <ScreenTitle>Teams</ScreenTitle>
      </div>
      <div className={styles.content}>
          <div className={styles.toolbar}>
            <Text className={styles.searchByLabel}>Search By</Text>
            <Dropdown
              className={styles.searchByDropdown}
              options={SEARCH_BY_OPTIONS}
              selectedKey={searchBy}
              onChange={onSearchByChange}
            />
            <SearchBox
              className={styles.searchBox}
              placeholder="Search"
              value={searchText}
              onChange={onSearchChange}
            />
            <CommandButton
              className={styles.clearButton}
              text="Clean all filters"
              onClick={onClearFilters}
            />
          </div>
          <div className={styles.listContainer}>
            {/* Custom header - widths from COLUMN_WIDTHS so they match content columns */}
            <div className={styles.tableHeader}>
              <div
                className={styles.tableHeaderCell}
                style={{ width: COLUMN_WIDTHS.projectName }}
              >
                Project name
              </div>
              <div
                className={styles.tableHeaderCell}
                style={{ width: COLUMN_WIDTHS.ownerEmail }}
              >
                Owner email
              </div>
              <div
                className={styles.tableHeaderCell}
                style={{ width: COLUMN_WIDTHS.plan }}
              >
                Plan
              </div>
              <div
                className={styles.tableHeaderCell}
                style={{ width: COLUMN_WIDTHS.createdAt }}
              >
                Create at
              </div>
            </div>
            <ShimmeredDetailsList
              className={styles.list}
              enableShimmer={loading}
              enableUpdateAnimations={false}
              onRenderRow={onRenderRow}
              onRenderItemColumn={onRenderItemColumn}
              selectionMode={SelectionMode.none}
              layoutMode={DetailsListLayoutMode.fixedColumns}
              columns={columns}
              items={paginatedItems}
              onShouldVirtualize={onShouldVirtualize}
            />
          </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <IconButton
                iconProps={{ iconName: "DoubleChevronLeft" }}
                title="First page"
                ariaLabel="First page"
                disabled={safePage === 1}
                onClick={onFirstPage}
                styles={{
                  root: { width: 24, height: 24, color: "#176df3" },
                  rootDisabled: { backgroundColor: "transparent", color: "#C8C6C4" },
                  icon: { fontSize: 14, fontWeight: 600, color: "#176df3" },
                  iconDisabled: { color: "#C8C6C4" },
                }}
              />
              <IconButton
                iconProps={{ iconName: "ChevronLeft" }}
                title="Previous page"
                ariaLabel="Previous page"
                disabled={safePage === 1}
                onClick={onPrevPage}
                styles={{
                  root: { width: 24, height: 24, color: "#176df3" },
                  rootDisabled: { backgroundColor: "transparent", color: "#C8C6C4" },
                  icon: { fontSize: 14, fontWeight: 600, color: "#176df3" },
                  iconDisabled: { color: "#C8C6C4" },
                }}
              />
              <div className={styles.paginationPages}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={
                      page === safePage
                        ? `${styles.paginationPageBtn} ${styles.paginationCurrent}`
                        : styles.paginationPageBtn
                    }
                    onClick={() => onPageClick(page)}
                    aria-label={`Page ${page}`}
                    aria-current={page === safePage ? "page" : undefined}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <IconButton
                iconProps={{ iconName: "ChevronRight" }}
                title="Next page"
                ariaLabel="Next page"
                disabled={safePage === totalPages}
                onClick={onNextPage}
                styles={{
                  root: { width: 24, height: 24, color: "#176df3" },
                  rootDisabled: { backgroundColor: "transparent", color: "#C8C6C4" },
                  icon: { fontSize: 14, fontWeight: 600, color: "#176df3" },
                  iconDisabled: { color: "#C8C6C4" },
                }}
              />
              <IconButton
                iconProps={{ iconName: "DoubleChevronRight" }}
                title="Last page"
                ariaLabel="Last page"
                disabled={safePage === totalPages}
                onClick={onLastPage}
                styles={{
                  root: { width: 24, height: 24, color: "#176df3" },
                  rootDisabled: { backgroundColor: "transparent", color: "#C8C6C4" },
                  icon: { fontSize: 14, fontWeight: 600, color: "#176df3" },
                  iconDisabled: { color: "#C8C6C4" },
                }}
              />
            </div>
          )}
        </div>
      </div>
  );
};

export default TeamsScreen;
