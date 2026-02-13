import React, { useState } from "react";
import {
  PrimaryButton,
  DefaultButton,
  Modal,
  TextField,
} from "@fluentui/react";
import styles from "./PortalAdminContent.module.css";

export interface PortalAdminEntry {
  id: string;
  email: string;
  isOwner: boolean;
  status: "Accepted" | "Pending";
}

const SAMPLE_ADMINS: PortalAdminEntry[] = [
  { id: "1", email: "alex.tsai@superapp.com", isOwner: true, status: "Accepted" },
  { id: "2", email: "peter.chen@superapp.com", isOwner: false, status: "Accepted" },
];

const PortalAdminContent: React.VFC = () => {
  const [admins, setAdmins] = useState<PortalAdminEntry[]>(() => [...SAMPLE_ADMINS]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<PortalAdminEntry | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");

  const openRemoveModal = (entry: PortalAdminEntry) => {
    setRemoveTarget(entry);
    setShowRemoveModal(true);
  };

  const closeRemoveModal = () => {
    setShowRemoveModal(false);
    setRemoveTarget(null);
  };

  const confirmRemove = () => {
    if (removeTarget) {
      setAdmins((prev) => prev.filter((a) => a.id !== removeTarget.id));
      closeRemoveModal();
    }
  };

  const openInviteModal = () => {
    setInviteEmail("");
    setShowInviteModal(true);
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteEmail("");
  };

  const confirmInvite = () => {
    const trimmed = inviteEmail.trim();
    if (!trimmed) return;
    setAdmins((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        email: trimmed,
        isOwner: false,
        status: "Pending",
      },
    ]);
    closeInviteModal();
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

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Owner email</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((entry) => (
              <tr key={entry.id}>
                <td className={styles.emailCell}>
                  {entry.email}
                  {entry.isOwner && (
                    <span className={styles.ownerBadge}> (Owner)</span>
                  )}
                </td>
                <td>
                  <span className={styles.statusAccepted}>{entry.status}</span>
                </td>
                <td>
                  <button
                    type="button"
                    className={styles.actionRemove}
                    onClick={() => openRemoveModal(entry)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite modal — enter email */}
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
          <div className={styles.inviteModalButtons}>
            <DefaultButton
              text="Cancel"
              onClick={closeInviteModal}
              styles={{ root: { borderColor: "#edebe9", color: "#323130" } }}
            />
            <PrimaryButton
              text="Invite"
              onClick={confirmInvite}
              disabled={!inviteEmail.trim()}
              styles={{
                root: { backgroundColor: "#176df3", borderColor: "#176df3" },
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Remove user confirmation modal */}
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
              {removeTarget?.email ?? ""}
            </span>{" "}
            from the portal admins? They will no longer be able to sign in or
            manage this project.
          </p>
          <div className={styles.removeModalButtons}>
            <DefaultButton
              text="Cancel"
              onClick={closeRemoveModal}
              styles={{ root: { borderColor: "#edebe9", color: "#323130" } }}
            />
            <DefaultButton
              text="Remove"
              onClick={confirmRemove}
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
