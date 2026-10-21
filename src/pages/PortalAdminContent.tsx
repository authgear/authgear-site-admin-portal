import React, { useState, useCallback, useEffect } from "react";
import { Button, Dialog, Table, Text } from "@radix-ui/themes";
import { PlusIcon } from "@radix-ui/react-icons";
import {
  listAppCollaborators,
  addAppCollaborator,
  removeAppCollaborator,
  promoteAppCollaborator,
} from "../api/siteadmin";
import type { Collaborator } from "../api/types";
import ShowLoading from "../components/ShowLoading";
import { Badge } from "../components/v2/Badge/Badge";
import { Callout } from "../components/v2/Callout/Callout";
import { ConfirmationDialog } from "../components/v2/ConfirmationDialog/ConfirmationDialog";
import { PrimaryButton } from "../components/v2/Button/PrimaryButton/PrimaryButton";
import { SecondaryButton } from "../components/v2/Button/SecondaryButton/SecondaryButton";
import { TextField } from "../components/v2/TextField/TextField";
import styles from "./PortalAdminContent.module.css";

interface PortalAdminContentProps {
  appId: string;
}

const PortalAdminContent: React.VFC<PortalAdminContentProps> = ({ appId }) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Collaborator | null>(null);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteTarget, setPromoteTarget] = useState<Collaborator | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const currentOwner = collaborators.find((c) => c.role === "owner") ?? null;

  const reload = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    listAppCollaborators(appId)
      .then((res) => setCollaborators(res.collaborators))
      .catch((e: unknown) => {
        const msg =
          e instanceof Error ? e.message : "Failed to load collaborators.";
        setLoadError(msg);
      })
      .finally(() => setLoading(false));
  }, [appId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const openRemoveModal = (entry: Collaborator) => {
    setRemoveTarget(entry);
    setActionError(null);
    setShowRemoveModal(true);
  };

  const closeRemoveModal = () => {
    setShowRemoveModal(false);
    setRemoveTarget(null);
    setActionError(null);
  };

  const confirmRemove = () => {
    if (!removeTarget) return;
    setRemoving(true);
    setActionError(null);
    removeAppCollaborator(appId, removeTarget.id)
      .then(() => {
        closeRemoveModal();
        reload();
      })
      .catch((e: unknown) => {
        const msg =
          e instanceof Error ? e.message : "Failed to remove collaborator.";
        setActionError(msg);
      })
      .finally(() => setRemoving(false));
  };

  const openPromoteModal = (entry: Collaborator) => {
    setPromoteTarget(entry);
    setActionError(null);
    setShowPromoteModal(true);
  };

  const closePromoteModal = () => {
    setShowPromoteModal(false);
    setPromoteTarget(null);
    setActionError(null);
  };

  const confirmPromote = () => {
    if (!promoteTarget) return;
    setPromoting(true);
    setActionError(null);
    promoteAppCollaborator(appId, promoteTarget.id)
      .then(() => {
        closePromoteModal();
        reload();
      })
      .catch((e: unknown) => {
        const msg =
          e instanceof Error ? e.message : "Failed to promote collaborator.";
        setActionError(msg);
      })
      .finally(() => setPromoting(false));
  };

  const openInviteModal = () => {
    setInviteEmail("");
    setActionError(null);
    setShowInviteModal(true);
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteEmail("");
    setActionError(null);
  };

  const confirmInvite = () => {
    const trimmed = inviteEmail.trim();
    if (!trimmed) return;
    setInviting(true);
    setActionError(null);
    addAppCollaborator(appId, trimmed)
      .then(() => {
        closeInviteModal();
        reload();
      })
      .catch((e: unknown) => {
        const msg =
          e instanceof Error ? e.message : "Failed to invite collaborator.";
        setActionError(msg);
      })
      .finally(() => setInviting(false));
  };

  const onInviteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inviteEmail.trim() || inviting) return;
    confirmInvite();
  };

  const actionErrorNode = actionError ? (
    <span className={styles.dialogError} role="alert">
      {actionError}
    </span>
  ) : null;

  return (
    <div className={styles.root}>
      <div className={styles.inviteRow}>
        <Button
          type="button"
          size="2"
          variant="solid"
          color="indigo"
          onClick={openInviteModal}
        >
          <PlusIcon />
          Add Admin
        </Button>
      </div>

      {loading ? (
        <ShowLoading />
      ) : loadError ? (
        <Callout type="error" text={loadError} showCloseButton={false} />
      ) : (
        <div className={styles.tableWrapper}>
          <Table.Root variant="surface" className={styles.table}>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell className={styles.roleColumn}>
                  Role
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell className={styles.actionColumn}>
                  Action
                </Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {collaborators.map((entry) => (
                <Table.Row key={entry.id} align="center">
                  <Table.Cell className={styles.emailCell}>
                    <Text as="span" size="2">
                      {entry.user_email}
                    </Text>
                  </Table.Cell>
                  <Table.Cell className={styles.roleColumn}>
                    <Badge
                      size="1"
                      variant={entry.role === "owner" ? "info" : "neutral"}
                      text={entry.role === "owner" ? "Owner" : "Editor"}
                    />
                  </Table.Cell>
                  <Table.Cell className={styles.actionColumn}>
                    <div className={styles.actionCell}>
                      {entry.role !== "owner" && (
                        <Button
                          type="button"
                          size="1"
                          variant="ghost"
                          color="indigo"
                          onClick={() => openPromoteModal(entry)}
                        >
                          Promote to Owner
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="1"
                        variant="ghost"
                        color="red"
                        onClick={() => openRemoveModal(entry)}
                      >
                        Remove
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
              {collaborators.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={3} className={styles.emptyCell}>
                    <Text as="span" size="2" color="gray">
                      No collaborators yet.
                    </Text>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Root>
        </div>
      )}

      {/* Invite dialog */}
      <Dialog.Root
        open={showInviteModal}
        onOpenChange={(open) => {
          if (!open) closeInviteModal();
        }}
      >
        <Dialog.Content maxWidth="440px" size="3" aria-describedby={undefined}>
          <Dialog.Title>Invite Portal Admin</Dialog.Title>
          <form className={styles.inviteForm} onSubmit={onInviteSubmit}>
            <TextField
              id="portal-admin-invite-email"
              size="2"
              type="email"
              label="Email"
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            {actionError ? (
              <Callout
                type="error"
                text={actionError}
                showCloseButton={false}
              />
            ) : null}
            <div className={styles.dialogButtons}>
              <SecondaryButton
                size="2"
                text="Cancel"
                disabled={inviting}
                onClick={closeInviteModal}
              />
              <PrimaryButton
                size="2"
                type="submit"
                text="Invite"
                loading={inviting}
                disabled={!inviteEmail.trim() || inviting}
              />
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Root>

      {/* Promote confirmation dialog */}
      <ConfirmationDialog
        open={showPromoteModal}
        onOpenChange={(open) => {
          if (!open) closePromoteModal();
        }}
        maxWidth="440px"
        title="Promote to Owner"
        description={
          <>
            Are you sure you want to promote{" "}
            <span className={styles.dialogEmail}>
              {promoteTarget?.user_email ?? ""}
            </span>{" "}
            to project owner?
            {currentOwner ? (
              <>
                {" "}
                The current owner{" "}
                <span className={styles.dialogEmail}>
                  {currentOwner.user_email}
                </span>{" "}
                will be demoted to editor.
              </>
            ) : null}
            {actionErrorNode}
          </>
        }
        confirmText="Promote"
        cancelText="Cancel"
        confirmColor="indigo"
        loading={promoting}
        onConfirm={confirmPromote}
        onCancel={closePromoteModal}
      />

      {/* Remove confirmation dialog */}
      <ConfirmationDialog
        open={showRemoveModal}
        onOpenChange={(open) => {
          if (!open) closeRemoveModal();
        }}
        maxWidth="440px"
        title="Remove User"
        description={
          <>
            Are you sure you want to remove{" "}
            <span className={styles.dialogEmail}>
              {removeTarget?.user_email ?? ""}
            </span>{" "}
            from the portal admins? They will no longer be able to sign in or
            manage this project.
            {removeTarget?.role === "owner" ? (
              <>
                {" "}
                This will leave the project without an owner until another
                collaborator is promoted.
              </>
            ) : null}
            {actionErrorNode}
          </>
        }
        confirmText="Remove"
        cancelText="Cancel"
        confirmColor="red"
        loading={removing}
        onConfirm={confirmRemove}
        onCancel={closeRemoveModal}
      />
    </div>
  );
};

export default PortalAdminContent;
