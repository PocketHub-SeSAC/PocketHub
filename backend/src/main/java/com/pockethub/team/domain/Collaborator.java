package com.pockethub.team.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;


@Entity
@Table(name = "collaborator",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "repo_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Collaborator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "collaborator_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)   // 표의 FK (CASCADE)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repo_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Repo repo;

    public Collaborator(User user, Repo repo) {
        this.user = user;
        this.repo = repo;
    }
}



