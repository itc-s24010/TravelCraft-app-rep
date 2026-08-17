package com.travel.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "trips")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "trip_id")
    private Long tripId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Users who joined this trip via its share link. */
    @ManyToMany
    @JoinTable(name = "trip_members",
            joinColumns = @JoinColumn(name = "trip_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id"))
    @JsonIgnore
    @Builder.Default
    private java.util.Set<User> members = new java.util.HashSet<>();

    @Column(name = "share_token", unique = true)
    private String shareToken;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "trip_date")
    private LocalDate tripDate;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "memo", columnDefinition = "TEXT")
    private String memo;

    @Column(name = "companions")
    private Integer companions;

    @Column(name = "is_completed")
    @JsonProperty("isCompleted")
    private Boolean isCompleted;

    /** Set by controllers at query-time; not persisted. */
    @Transient
    @JsonProperty("isOwner")
    private Boolean isOwner;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    /** Display names shown in the shared-trip participant list. */
    @JsonProperty("companionNames")
    public java.util.List<String> getCompanionNames() {
        java.util.LinkedHashSet<String> names = new java.util.LinkedHashSet<>();
        if (user != null && user.getUserName() != null && !user.getUserName().isBlank()) {
            names.add(user.getUserName());
        }
        if (members != null) {
            members.stream()
                    .filter(member -> member.getUserName() != null && !member.getUserName().isBlank())
                    .map(User::getUserName)
                    .sorted()
                    .forEach(names::add);
        }
        return new java.util.ArrayList<>(names);
    }
}
