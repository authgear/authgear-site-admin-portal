import React, { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Select,
  Spinner,
  Table,
  Text,
  TextField as RadixTextField,
} from "@radix-ui/themes";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Cross2Icon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import ScreenTitle from "../components/ScreenTitle";
import PaginationWidget from "../components/PaginationWidget";
import { Callout } from "../components/v2/Callout/Callout";
import { listApps, listPlans, type ListAppsParams } from "../api/siteadmin";
import { SiteAdminAPIError } from "../api/client";
import type { App } from "../api/types";

import styles from "./ProjectsScreen.module.css";

const PAGE_SIZE = 10;
const COLUMN_COUNT = 5;

interface Option {
  key: string;
  text: string;
}

const SEARCH_BY_OPTIONS: Option[] = [
  { key: "projectId", text: "Project ID" },
  { key: "collaboratorEmail", text: "Collaborator" },
];

const ALL_PLANS_KEY = "__all__";

type SortKey = "created_at" | "mau";
type SortOrder = "asc" | "desc";

interface SortableHeaderProps {
  label: string;
  active: boolean;
  order: SortOrder;
  className?: string;
  onClick: () => void;
}

const SortableHeader: React.VFC<SortableHeaderProps> = ({
  label,
  active,
  order,
  className,
  onClick,
}) => (
  <Table.ColumnHeaderCell
    className={className}
    aria-sort={
      active ? (order === "asc" ? "ascending" : "descending") : undefined
    }
  >
    <button
      type="button"
      className={styles.sortButton}
      onClick={onClick}
      aria-label={`Sort by ${label}`}
    >
      {label}
      {active ? (
        order === "asc" ? (
          <ArrowUpIcon className={styles.sortIcon} />
        ) : (
          <ArrowDownIcon className={styles.sortIcon} />
        )
      ) : null}
    </button>
  </Table.ColumnHeaderCell>
);

const ProjectsScreen: React.VFC = function ProjectsScreen() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<App[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SiteAdminAPIError | null>(null);
  const [searchBy, setSearchBy] = useState<string>("projectId");
  const [searchText, setSearchText] = useState<string>("");
  const [planFilter, setPlanFilter] = useState<string>(ALL_PLANS_KEY);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [sortExplicit, setSortExplicit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [planOptions, setPlanOptions] = useState<Option[]>([
    { key: ALL_PLANS_KEY, text: "All plans" },
  ]);

  useEffect(() => {
    listPlans()
      .then((res) => {
        setPlanOptions([
          { key: ALL_PLANS_KEY, text: "All plans" },
          ...res.plans.map((p) => ({ key: p.name, text: p.name })),
        ]);
      })
      .catch(() => {
        // Keep default "All plans" option only.
      });
  }, []);

  const collaboratorSearch =
    searchBy === "collaboratorEmail" ? searchText.trim() : undefined;
  // When collaborator_search is active without an explicit sort choice, the
  // server defaults to relevance — we omit sort/order to let that happen.
  const sendSort = !collaboratorSearch || sortExplicit;

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params: ListAppsParams = { page: currentPage, page_size: PAGE_SIZE };
    if (collaboratorSearch) params.collaborator_search = collaboratorSearch;
    if (searchText.trim() && searchBy === "projectId")
      params.app_id = searchText.trim();
    if (sendSort) {
      params.sort = sortKey;
      params.order = sortOrder;
    }
    if (planFilter !== ALL_PLANS_KEY) {
      params.plan = planFilter;
    }
    listApps(params)
      .then((res) => {
        setApps(res.apps);
        setTotalCount(res.total_count);
      })
      .catch((err: SiteAdminAPIError) => setError(err))
      .finally(() => setLoading(false));
  }, [
    currentPage,
    searchBy,
    searchText,
    planFilter,
    sortKey,
    sortOrder,
    collaboratorSearch,
    sendSort,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const onChangeOffset = useCallback((offset: number) => {
    setCurrentPage(Math.floor(offset / PAGE_SIZE) + 1);
  }, []);

  const goToProject = useCallback(
    (item: App) => navigate(`/project/${item.id}`),
    [navigate]
  );

  const onPlanFilterChange = useCallback((value: string) => {
    setPlanFilter(value);
    setCurrentPage(1);
  }, []);

  const onToggleSort = useCallback(
    (key: SortKey) => {
      setCurrentPage(1);
      setSortExplicit(true);
      setSortKey((prevKey) => {
        if (prevKey === key) return prevKey;
        return key;
      });
      setSortOrder((prevOrder) => {
        // If switching to a different key, reset to desc; otherwise toggle.
        return sortKey === key
          ? prevOrder === "asc"
            ? "desc"
            : "asc"
          : "desc";
      });
    },
    [sortKey]
  );

  const onSearchByChange = useCallback((value: string) => {
    setSearchBy(value);
    setSortExplicit(false);
    setCurrentPage(1);
  }, []);

  const onSearchChange = useCallback((newValue: string) => {
    setSearchText(newValue);
    setSortExplicit(false);
    setCurrentPage(1);
  }, []);

  const onClearFilters = useCallback(() => {
    setSearchText("");
    setPlanFilter(ALL_PLANS_KEY);
    setSortKey("created_at");
    setSortOrder("desc");
    setSortExplicit(false);
    setCurrentPage(1);
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <ScreenTitle>Projects</ScreenTitle>
      </div>
      <div className={styles.content}>
        {error && (
          <Callout type="error" text={error.message} showCloseButton={false} />
        )}
        <div className={styles.toolbar}>
          <div className={styles.filterGroup}>
            <Text as="label" size="2" weight="medium" className={styles.label}>
              Search By
            </Text>
            <Select.Root value={searchBy} onValueChange={onSearchByChange}>
              <Select.Trigger
                className={styles.select}
                aria-label="Search by"
              />
              <Select.Content position="popper">
                {SEARCH_BY_OPTIONS.map((o) => (
                  <Select.Item key={o.key} value={o.key}>
                    {o.text}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <RadixTextField.Root
              className={styles.searchBox}
              size="2"
              type="search"
              placeholder="Search"
              aria-label="Search"
              value={searchText}
              onChange={(e) => onSearchChange(e.currentTarget.value)}
            >
              <RadixTextField.Slot side="left">
                <MagnifyingGlassIcon className={styles.searchIcon} />
              </RadixTextField.Slot>
              {searchText !== "" ? (
                <RadixTextField.Slot side="right">
                  <button
                    type="button"
                    className={styles.searchClearButton}
                    aria-label="Clear search"
                    onClick={() => onSearchChange("")}
                  >
                    <Cross2Icon className={styles.searchIcon} />
                  </button>
                </RadixTextField.Slot>
              ) : null}
            </RadixTextField.Root>
          </div>
          <div className={styles.filterGroup}>
            <Text as="label" size="2" weight="medium" className={styles.label}>
              Plan
            </Text>
            <Select.Root value={planFilter} onValueChange={onPlanFilterChange}>
              <Select.Trigger className={styles.select} aria-label="Plan" />
              <Select.Content position="popper">
                {planOptions.map((o) => (
                  <Select.Item key={o.key} value={o.key}>
                    {o.text}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </div>
          <Button
            type="button"
            variant="ghost"
            color="gray"
            size="2"
            className={styles.clearButton}
            onClick={onClearFilters}
          >
            Clear all filters
          </Button>
        </div>
        <div className={styles.tableWrapper}>
          <Table.Root className={styles.table} variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell className={styles.colWide}>
                  Project ID
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell className={styles.colWide}>
                  Owner Email
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell className={styles.colWide}>
                  Plan
                </Table.ColumnHeaderCell>
                <SortableHeader
                  label="Last Month MAU"
                  className={styles.colNarrow}
                  active={sendSort && sortKey === "mau"}
                  order={sortOrder}
                  onClick={() => onToggleSort("mau")}
                />
                <SortableHeader
                  label="Created at"
                  className={styles.colWide}
                  active={sendSort && sortKey === "created_at"}
                  order={sortOrder}
                  onClick={() => onToggleSort("created_at")}
                />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan={COLUMN_COUNT}>
                    <div className={styles.loading}>
                      <Spinner />
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : apps.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={COLUMN_COUNT}>
                    <Text
                      as="p"
                      size="2"
                      color="gray"
                      className={styles.emptyText}
                    >
                      No projects found.
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                apps.map((item) => (
                  <Table.Row
                    key={item.id}
                    className={styles.clickableRow}
                    onClick={(e) => {
                      // The project ID is a real link (keyboard focus,
                      // Cmd-click, middle-click); let it handle its own click.
                      if ((e.target as HTMLElement).closest("a") != null)
                        return;
                      goToProject(item);
                    }}
                  >
                    <Table.Cell>
                      <Link
                        to={`/project/${item.id}`}
                        className={styles.idLink}
                      >
                        {item.id}
                      </Link>
                    </Table.Cell>
                    <Table.Cell>
                      {item.owner_email ? (
                        <Text size="2" color="gray">
                          {item.owner_email}
                        </Text>
                      ) : (
                        <Text size="2" color="gray" className={styles.noOwner}>
                          No owner
                        </Text>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {item.plan}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {item.last_month_mau.toLocaleString()}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {new Date(item.created_at).toLocaleString()}
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </div>
        {totalPages > 1 && (
          <PaginationWidget
            className={styles.pagination}
            offset={(safePage - 1) * PAGE_SIZE}
            pageSize={PAGE_SIZE}
            totalCount={totalCount}
            onChangeOffset={onChangeOffset}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectsScreen;
