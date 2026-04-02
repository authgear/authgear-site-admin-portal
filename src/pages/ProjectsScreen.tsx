import React, { useMemo, useState, useCallback, useEffect } from "react";
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
  MessageBar,
  MessageBarType,
} from "@fluentui/react";
import ScreenTitle from "../components/ScreenTitle";
import { listApps, type ListAppsParams } from "../api/siteadmin";
import { SiteAdminAPIError } from "../api/client";
import type { App } from "../api/types";

import styles from "./ProjectsScreen.module.css";

function onShouldVirtualize(_: IListProps): boolean {
  return false;
}

/* Single source of truth for column widths - header and content must match (equal width) */
const COLUMN_WIDTH = 225;
const COLUMN_WIDTHS = {
  projectName: COLUMN_WIDTH,
  ownerEmail: COLUMN_WIDTH,
  plan: COLUMN_WIDTH,
  createdAt: COLUMN_WIDTH,
} as const;

const PAGE_SIZE = 10;

const SEARCH_BY_OPTIONS: IDropdownOption[] = [
  { key: "projectId", text: "Project ID" },
  { key: "ownerEmail", text: "Owner Email" },
];

interface ProjectNameCellProps {
  item: App;
}

const ProjectNameCell: React.VFC<ProjectNameCellProps> = ({ item }) => {
  return (
    <div className={styles.projectNameCell}>
      <Text className={styles.projectName}>{item.id}</Text>
    </div>
  );
};

const ProjectsScreen: React.VFC = function ProjectsScreen() {
  const [apps, setApps] = useState<App[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SiteAdminAPIError | null>(null);
  const [searchBy, setSearchBy] = useState<string>("projectId");
  const [searchText, setSearchText] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params: ListAppsParams = { page: currentPage, page_size: PAGE_SIZE };
    if (searchText.trim()) {
      if (searchBy === "projectId") params.app_id = searchText.trim();
      else if (searchBy === "ownerEmail") params.owner_email = searchText.trim();
    }
    listApps(params)
      .then((res) => {
        setApps(res.apps);
        setTotalCount(res.total_count);
      })
      .catch((err: SiteAdminAPIError) => setError(err))
      .finally(() => setLoading(false));
  }, [currentPage, searchBy, searchText]);

  const columns: IColumn[] = useMemo(() => [
    {
      key: "projectName",
      fieldName: "id",
      name: "Project ID",
      minWidth: COLUMN_WIDTHS.projectName,
      maxWidth: COLUMN_WIDTHS.projectName,
      columnActionsMode: ColumnActionsMode.disabled,
    },
    {
      key: "ownerEmail",
      fieldName: "owner_email",
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
      fieldName: "created_at",
      name: "Create at",
      minWidth: COLUMN_WIDTHS.createdAt,
      maxWidth: COLUMN_WIDTHS.createdAt,
      columnActionsMode: ColumnActionsMode.disabled,
    },
  ], []);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

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
    const item = props.item as App;
    return (
      <Link to={`/project/${item.id}`} className={styles.rowLink}>
        <DetailsRow {...props} />
      </Link>
    );
  }, []);

  const onRenderItemColumn = useCallback(
    (item: App, _index?: number, column?: IColumn) => {
      switch (column?.key) {
        case "projectName":
          return <ProjectNameCell item={item} />;
        case "ownerEmail":
          return (
            <div className={styles.cellContentLeft}>
              <Text className={styles.cellText}>{item.owner_email}</Text>
            </div>
          );
        case "plan":
          return (
            <div className={styles.cellContentLeft}>
              <Text className={styles.cellText}>{item.plan}</Text>
            </div>
          );
        case "createdAt":
          return (
            <Text className={styles.cellText}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          );
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
        setCurrentPage(1);
      }
    },
    []
  );

  const onSearchChange = useCallback(
    (_event?: React.ChangeEvent<HTMLInputElement>, newValue?: string) => {
      setSearchText(newValue || "");
      setCurrentPage(1);
    },
    []
  );

  const onClearFilters = useCallback(() => {
    setSearchText("");
    setCurrentPage(1);
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <ScreenTitle>Projects</ScreenTitle>
      </div>
      <div className={styles.content}>
          {error && (
            <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
              {error.message}
            </MessageBar>
          )}
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
                Project ID
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
              items={apps}
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

export default ProjectsScreen;
