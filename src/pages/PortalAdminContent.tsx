import React, { useState, useCallback, useEffect } from "react";
import {
  PrimaryButton,
  DefaultButton,
  Modal,
  TextField,
  Spinner,
  SpinnerSize,
} from "@fluentui/react";
import { listAppCollaborators, addAppCollaborator, removeAppCollaborator } from "../api/siteadmin";
import type { Collaborator } from "../api/types";
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
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    listAppCollaborators(appId)
      .then((res) => setCollaborators(res.collaborators))
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Failed to load collaborators.";
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
        const msg = e instanceof Error ? e.message : "Failed to remove collaborator.";
        setActionError(msg);
      })
      .finally(() => setRemoving(false));
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
        const msg = e instanceof Error ? e.message : "Failed to invite collaborator.";
        setActionError(msg);
      })
      .finally(() => setInviting(false));
  };

  return (
    <div className={styles.root}>
      <div className={styles.inviteRow}>
        <PrimaryButton
          text="Invite"
          iconProps={{ iconName: "Add" }}
          onClick={openInviteModal}
          styles={{
            root: {
              backgroundColor: "#176df3",
              borderColor: "#176df3",
              fontSize: 14,
            },
            icon: { color: "#ffffff", fontSize: 14 },
          }}
        />
      </div>

      {loading ? (
        <div style={{ padding: "24px 0", display: "flex", justifyContent: "center" }}>
          <Spinner size={SpinnerSize.medium} />
        </div>
      ) : loadError ? (
        <p style={{ color: "#a4262c", fontSize: 14 }}>{loadError}</p>
      ) : (
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {collaborators.map((entry) => (
                <tr key={entry.id}>
                  <td className={styles.emailCell}>{entry.user_email}</td>
                  <td>
                    <span className={styles.statusAccepted}>
                      {entry.role === "owner" ? "Owner" : "Editor"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.actionRemove}
                      onClick={() => openRemoveModal(entry)}
                      disabled={entry.role === "owner"}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {collaborators.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", color: "#797775", padding: "16px 0" }}>
                    No collaborators yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite modal */}
      <Modal
        isOpen={showInviteModal}
        onDismiss={closeInviteModal}
        isBlocking={false}
        styles={{ main: { maxWidth: 440, width: "90%" } }}
      >
        <div style={{ padding: 24 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#323130",
              marginBottom: 20,
            }}
          >
            Invite Portal Admin
          </div>
          <div className={styles.inviteModalBody}>
            <label className={styles.inviteModalLabel} htmlFor="portal-admin-invite-email">
              Email
            </label>
            <TextField
              id="portal-admin-invite-email"
              type="email"
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(_, value) => setInviteEmail(value ?? "")}
              styles={{
                root: { width: "100%" },
                field: { fontSize: 14 },
              }}
            />
          </div>
          {actionError && (
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "#a4262c" }}>{actionError}</p>
          )}
          <div className={styles.inviteModalButtons}>
            <DefaultButton
              text="Cancel"
              onClick={closeInviteModal}
              styles={{ root: { borderColor: "#edebe9", color: "#323130" } }}
            />
            <PrimaryButton
              text="Invite"
              onClick={confirmInvite}
              disabled={!inviteEmail.trim() || inviting}
              styles={{
                root: { backgroundColor: "#176df3", borderColor: "#176df3" },
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Remove confirmation modal */}
      <Modal
        isOpen={showRemoveModal}
        onDismiss={closeRemoveModal}
        isBlocking={false}
        styles={{ main: { maxWidth: 440, width: "90%" } }}
      >
        <div style={{ padding: 24 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#323130",
              marginBottom: 12,
            }}
          >
            Remove User
          </div>
          <p className={styles.removeModalMessage}>
            Are you sure you want to remove{" "}
            <span className={styles.removeModalEmail}>
              {removeTarget?.user_email ?? ""}
            </span>{" "}
            from the portal admins? They will no longer be able to sign in or
            manage this project.
          </p>
          {actionError && (
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "#a4262c" }}>{actionError}</p>
          )}
          <div className={styles.removeModalButtons}>
            <DefaultButton
              text="Cancel"
              onClick={closeRemoveModal}
              styles={{ root: { borderColor: "#edebe9", color: "#323130" } }}
            />
            <DefaultButton
              text="Remove"
              onClick={confirmRemove}
              disabled={removing}
              styles={{
                root: {
                  backgroundColor: "#e23d3d",
                  borderColor: "#e23d3d",
                  color: "#ffffff",
                },
                rootHovered: {
                  backgroundColor: "#c93535",
                  borderColor: "#c93535",
                  color: "#ffffff",
                },
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PortalAdminContent;
