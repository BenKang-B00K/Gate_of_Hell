/* e:\WebGame\Gate of Hell\script.js */
const gameContainer = document.getElementById('game-container');
const road = document.getElementById('road');

let money = 100;
let damageMultiplier = 1.0; // 아군 공격력 배율
let critChance = 0; // 치명타 확률
let spawnInterval = 2000; // 적 스폰 간격 (초기값 2초)

// 데미지 적용 함수 (공유 데미지 처리용)
function applyDamage(target, amount, sourceTower, isShared = false) {
    if (!target || target.hp <= 0) return;

    target.hp -= amount;

    // [마스터] 영혼 구속자: 데미지 공유
    // 공유된 데미지(isShared=true)는 다시 공유되지 않음 (무한 루프 방지)
    if (!isShared && target.linkId && target.linkEndTime > Date.now()) {
        const linkedEnemies = enemies.filter(e => e !== target && e.linkId === target.linkId && e.hp > 0);
        const sharedAmount = amount * 0.5; // 50% 공유
        linkedEnemies.forEach(e => {
            applyDamage(e, sharedAmount, sourceTower, true);
        });
    }

    if (target.hp <= 0) {
        handleEnemyDeath(target, sourceTower);
    }
}

// 적 이동 및 게임 루프
function gameLoop() {
    const roadRect = road.getBoundingClientRect();
    const targetY = roadRect.height - 60; // 포탈 도달 Y 위치
    const gameWidth = gameContainer.offsetWidth;

    // 적 상태 초기화 (매 프레임 다시 계산하는 상태들) - 루프 시작 부분으로 이동
    enemies.forEach(e => {
        e.isSilenced = false; // 침묵은 장판 위에 있을 때만 유지
        e.inBlizzard = false; // 눈보라 효과 초기화
        if(e.element) e.element.classList.remove('silenced');
    });

    // --- 벽(Wall) 관리 ---
    const nowTime = Date.now();
    for (let i = walls.length - 1; i >= 0; i--) {
        if (nowTime > walls[i].endTime) {
            walls[i].element.remove();
            walls.splice(i, 1);
        }
    }

    // --- 지면 효과(장판) 관리 ---
    for (let i = groundEffects.length - 1; i >= 0; i--) {
        const effect = groundEffects[i];
        if (nowTime > effect.endTime) {
            effect.element.remove();
            groundEffects.splice(i, 1);
            continue;
        }

        // 효과 적용
        if (effect.type === 'seal') {
            // 대봉인사: 범위 내 적 침묵
            enemies.forEach(e => {
                const exPx = (e.x / 100) * gameWidth;
                const dist = Math.sqrt(Math.pow(exPx - effect.x, 2) + Math.pow(e.y - effect.y, 2));
                if (dist <= effect.radius) {
                    e.isSilenced = true;
                    if (e.element) e.element.classList.add('silenced');
                    // 투명화 해제
                    if (e.isPhasing) {
                        e.isPhasing = false;
                        if (e.element) e.element.style.opacity = 1;
                    }
                }
            });
        } else if (effect.type === 'fire') {
            // 화염 부적 명장: 범위 내 적 데미지 (초당 20)
            enemies.forEach(e => {
                const exPx = (e.x / 100) * gameWidth;
                const dist = Math.sqrt(Math.pow(exPx - effect.x, 2) + Math.pow(e.y - effect.y, 2));
                if (dist <= effect.radius) {
                    applyDamage(e, 20 / 60, null); // 60fps 기준 프레임당 데미지
                }
            });
        } else if (effect.type === 'blizzard') {
            // 만년설의 신녀: 범위 내 적 속도 감소
            enemies.forEach(e => {
                const exPx = (e.x / 100) * gameWidth;
                const dist = Math.sqrt(Math.pow(exPx - effect.x, 2) + Math.pow(e.y - effect.y, 2));
                if (dist <= effect.radius) {
                    e.inBlizzard = true;
                }
            });
        }
    }

    // --- 아군 해골 병사 관리 (망령 군주) ---
    for (let i = friendlySkeletons.length - 1; i >= 0; i--) {
        const skel = friendlySkeletons[i];
        skel.y -= skel.speed; // 위로 이동

        // 화면 밖으로 나가면 제거
        if (skel.y < 0) {
            skel.element.remove();
            friendlySkeletons.splice(i, 1);
            continue;
        }

        skel.element.style.top = `${skel.y}px`;

        // 적과 충돌 체크
        const hitEnemy = enemies.find(e => Math.abs(e.y - skel.y) < 15 && Math.abs(e.x - skel.x) < 5 && e.hp > 0);
        if (hitEnemy) {
            // 충돌 시 적 체력 비례 데미지 (예: 최대 체력의 50%)
            const dmg = hitEnemy.maxHp * 0.5;
            applyDamage(hitEnemy, dmg, null);
            
            skel.element.remove();
            friendlySkeletons.splice(i, 1);
        }
    }

    // 0. 스폰 로직 (웨이브 시스템)
    if (!isStageStarting) {
        if (isBossStage) {
            // 보스 스테이지: 보스가 살아있는 동안 2초마다 잡몹 소환
            if (bossInstance && bossInstance.hp > 0) {
                if (Date.now() - lastSpawnTime > spawnInterval) {
                    spawnWave();
                    spawnInterval = Math.random() * (3100 - 1500) + 1500; // 1.5 ~ 3.1초 랜덤
                }
            } else if (enemies.length === 0) {
                // 보스도 죽고 잡몹도 다 잡으면 클리어
                stage++;
                initStage();
            }
        } else if (currentStageSpawned < totalStageEnemies) {
            // 일반 스테이지: 맵에 적이 없거나, 일정 시간이 지났으면 스폰
            if (enemies.length === 0 || Date.now() - lastSpawnTime > spawnInterval) {
                spawnWave();
                spawnInterval = Math.random() * (3100 - 1500) + 1500; // 1.5 ~ 3.1초 랜덤
            }
        } else if (enemies.length === 0) {
            // 스테이지 클리어 (모든 적 처치)
            stage++;
            initStage();
        }
    }

    // --- 적 상태 업데이트 (속도, 오라 등) ---
    const frosts = enemies.filter(e => e.type === 'frost');
    
    // [클래스 특성] 버프 토템 (영적 탐지기 계열): 버프 계산
    // 1. 모든 타워 버프 초기화
    towers.forEach(t => {
        t.rangeBonus = 0;
        t.damageBonus = 0;
        t.speedBonus = 0;
    });
    
    // 2. 주변 타워 버프 적용
    towers.forEach(t => {
        if (['tracker', 'seer', 'commander'].includes(t.data.type)) {
            const idx = slots.indexOf(t.slotElement);
            if (idx === -1) return;
            
            const isLeft = idx < 30;
            const localIdx = isLeft ? idx : idx - 30;
            const row = Math.floor(localIdx / 3);
            const col = localIdx % 3;
            
            // 상하좌우 인덱스 계산 (같은 그리드 내에서만)
            const neighbors = [];
            if (row > 0) neighbors.push(idx - 3); // 상
            if (row < 9) neighbors.push(idx + 3); // 하
            if (col > 0) neighbors.push(idx - 1); // 좌
            if (col < 2) neighbors.push(idx + 1); // 우

            neighbors.forEach(nIdx => {
                const neighborTower = towers.find(nt => nt.slotElement === slots[nIdx]);
                if (neighborTower) {
                    if (t.data.type === 'tracker') neighborTower.rangeBonus = (neighborTower.rangeBonus || 0) + 50; // 사거리 50 증가
                    if (t.data.type === 'seer') neighborTower.damageBonus = (neighborTower.damageBonus || 0) + 10; // 공격력 10 증가
                    if (t.data.type === 'commander') neighborTower.speedBonus = (neighborTower.speedBonus || 0) + 0.2; // 공속 20% 증가
                }
            });
        }
    });

    enemies.forEach(e => {
        // 1. 기본 속도 재설정 및 고유 동작
        if (e.type === 'boar') {
            // 돌진하는 멧돼지: 거리에 따라 지수적 가속
            const progress = Math.max(0, Math.min(e.y / targetY, 1));
            e.speed = e.baseSpeed * (1 + Math.pow(progress, 2) * 5) * globalSpeedFactor; // 최대 6배 가속
        } else {
            e.speed = e.baseSpeed * globalSpeedFactor;
        }

        // [상태이상] 영혼 사슬꾼: 이동 속도 10% 감소
        if (e.isSlowed) {
            e.speed *= 0.9;
        }

        // [상태이상] 눈보라: 이동 속도 50% 감소
        if (e.inBlizzard) {
            e.speed *= 0.5;
        }
        
        // [상태이상] 기절 (이동 불가)
        if (e.isStunned) {
            if (Date.now() > e.stunEndTime) {
                e.isStunned = false;
                if (e.element) e.element.classList.remove('stunned');
            } else {
                e.speed = 0;
            }
        }

        // 2. 오라 적용 (광속의 그림자는 무시)
        if (e.type !== 'lightspeed' && !e.isBoarded && frosts.length > 0) {
            let multiplier = 1;
            for (const frost of frosts) {
                if (e !== frost) { // 자신 제외
                    const exPx = (e.x / 100) * gameWidth;
                    const fxPx = (frost.x / 100) * gameWidth;
                    const dist = Math.sqrt(Math.pow(exPx - fxPx, 2) + Math.pow(e.y - frost.y, 2));
                    
                    if (dist < 100) multiplier += 0.15; // 15% 증가 (중첩 가능)
                }
            }
            e.speed *= multiplier;
        }

        // [특수 능력] 용암의 갈망: 빙결 시 해제 및 도약
        if (e.type === 'lava' && e.isFrozen) {
            e.isFrozen = false; // 빙결 해제
            e.y += 50; // 0.5칸(약 50px) 앞으로 도약
        }

        // [보스 능력] 바알세불: 역병의 점액 (5초마다)
        if (e.isBoss && e.data.type === 'beelzebub') {
            if (Date.now() - e.lastAbilityTime > 5000) {
                e.lastAbilityTime = Date.now();
                // 랜덤 슬롯 4개 오염
                const targets = slots.sort(() => 0.5 - Math.random()).slice(0, 4);
                targets.forEach(slot => {
                    slot.classList.add('plagued');
                    // 4초 후 해제
                    setTimeout(() => { slot.classList.remove('plagued'); }, 4000);
                });
            }
        }

        // [보스 능력] 케르베로스: 삼두의 포효 (5초마다)
        if (e.isBoss && e.data.type === 'cerberus') {
            if (Date.now() - e.lastAbilityTime > 5000) {
                e.lastAbilityTime = Date.now();
                // 랜덤 타워 3개 공포
                const activeTowers = towers.filter(t => !t.isFeared);
                if (activeTowers.length > 0) {
                    // 셔플 후 3개 선택
                    const targets = activeTowers.sort(() => 0.5 - Math.random()).slice(0, 3);
                    targets.forEach(t => {
                        t.isFeared = true;
                        t.element.classList.add('feared');
                        // 2초 후 해제
                        setTimeout(() => { t.isFeared = false; if(t.element) t.element.classList.remove('feared'); }, 2000);
                    });
                }
            }
        }
    });

    // 1. 적 이동 처리
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // [클래스 특성] 화염 마법사: 화상 데미지 (초당 1% MaxHP)
        if (enemy.isBurning) {
            if (Date.now() > enemy.burnEndTime) {
                enemy.isBurning = false;
                if (enemy.element) enemy.element.classList.remove('burning');
            } else {
                // 60fps 기준 프레임당 데미지
                const burnDmg = (enemy.maxHp * 0.01) / 60;
                applyDamage(enemy, burnDmg, null);
                if (enemy.hp <= 0) continue;
            }
        }

        // [특수 능력] 카론의 승객: 보스와 함께 이동
        if (enemy.isBoarded) {
            if (enemy.parentBoss && enemy.parentBoss.hp > 0) {
                // 보스 위치에 고정
                enemy.y = enemy.parentBoss.y + enemy.offsetY;
                // X축은 % 단위이므로 픽셀 오프셋을 대략적으로 변환 (게임폭 360px 기준)
                enemy.x = enemy.parentBoss.x + (enemy.offsetX / 3.6);
            } else {
                // 보스가 죽으면 하차 (무적 해제)
                enemy.isBoarded = false;
                enemy.invincible = false;
                enemy.element.classList.remove('boarded');
            }
        } else {
            enemy.y += enemy.speed;

            // [클래스 특성] 강령술사: 벽 충돌 체크
            // 벽이 있으면 이동 취소 (간단한 Y축 거리 체크)
            // 벽은 road 위에 있음. enemy.y는 road 기준 픽셀.
            if (walls.some(w => Math.abs(w.y - enemy.y) < 15 && Math.abs(w.x - enemy.x) < 15)) {
                enemy.y -= enemy.speed; // 이동 되돌리기 (멈춤)
            }
        }
        
        // [특수 능력] 차원 이동자: 일정 확률로 투명화 (공격 무시)
        if (enemy.type === 'dimension' && !enemy.isPhasing && !enemy.isSilenced) {
            if (Math.random() < 0.01) { // 프레임당 1% 확률 (침묵 아닐 때만)
                enemy.isPhasing = true;
                enemy.element.style.opacity = 0.3; // 반투명 처리
                // 2초 후 해제
                setTimeout(() => { enemy.isPhasing = false; if(enemy.element) enemy.element.style.opacity = 1; }, 2000);
            }
        }

        // [마스터] 진실의 구도자: 은신 감지 (범위 내 은신 해제)
        if (enemy.isPhasing) {
            const revealed = towers.some(t => {
                if (t.data.type !== 'seer') return false;
                const tRect = t.slotElement.getBoundingClientRect();
                const dist = Math.sqrt(Math.pow(enemy.x - (tRect.left + tRect.width/2)/gameWidth*100, 2) + Math.pow(enemy.y - (tRect.top + tRect.height/2), 2));
                return dist <= (t.range + (t.rangeBonus || 0)); // 픽셀 단위 거리 계산 필요하지만 약식 처리
            });
            if (revealed) {
                enemy.isPhasing = false;
                if(enemy.element) enemy.element.style.opacity = 1;
            }
        }

        // 진행률에 따라 X축 위치를 중앙(50%)으로 이동
        const progress = Math.min(enemy.y / targetY, 1);
        enemy.x = enemy.initialX + (50 - enemy.initialX) * progress;

        // 포탈 도달 확인 (road 높이 - 포탈 높이 정도)
        if (enemy.y >= targetY) {
            // [마스터] 신성한 성벽: 문 앞 수비 (인덱스 27~29, 57~59)
            const rampart = towers.find(t => {
                if (t.data.type !== 'rampart' || (t.charges || 0) <= 0) return false;
                const idx = slots.indexOf(t.slotElement);
                // 좌측 하단(27~29) 또는 우측 하단(57~59) 슬롯인지 확인
                return (idx >= 27 && idx <= 29) || (idx >= 57 && idx <= 59);
            });

            if (rampart) {
                rampart.charges--;
                enemy.y = 0; // 시작 지점으로
                enemy.element.style.top = '0px';
                // 이펙트 (즉시 이동)
                enemy.element.style.transition = 'none';
                setTimeout(() => enemy.element.style.transition = '', 50);
                
                if (rampart.charges <= 0) rampart.element.style.filter = 'grayscale(100%)'; // 소진 표시
                continue;
            }

            enemy.element.remove();
            enemies.splice(i, 1);
            continue;
        }

        enemy.element.style.top = `${enemy.y}px`;
        enemy.element.style.left = `${enemy.x}%`;
    }

    // 2. 타워 공격 처리
    const now = Date.now();
    towers.forEach(tower => {
        // 공포 또는 영구 동결 상태면 공격 불가
        if (tower.isFeared || tower.isFrozenTomb) return;

        // 공격 속도 계산 (기본 + 버프)
        let speedMult = 1.0 + (tower.speedBonus || 0);
        // 역병 상태면 속도 40% 감소 (0.6배)
        if (tower.slotElement.classList.contains('plagued')) speedMult *= 0.6;
        let currentCooldown = tower.cooldown / speedMult;

        if (now - tower.lastShot >= currentCooldown) {
            // 타워의 현재 화면상 위치 구하기
            const towerRect = tower.slotElement.getBoundingClientRect();
            const towerX = towerRect.left + towerRect.width / 2;
            const towerY = towerRect.top + towerRect.height / 2;

            // [마스터] 천수 궁수: 다중 발사 (6발, 최대 4명)
            if (tower.data.type === 'thousandhand') {
                const effectiveRange = tower.range + (tower.rangeBonus || 0);
                
                // 사거리 내 적 찾기
                const validEnemies = enemies.filter(e => {
                    if (e.isPhasing || e.invincible) return false;
                    
                    const enemyRect = e.element.getBoundingClientRect();
                    const enemyX = enemyRect.left + enemyRect.width / 2;
                    const enemyY = enemyRect.top + enemyRect.height / 2;
                    const dist = Math.sqrt(Math.pow(enemyX - towerX, 2) + Math.pow(enemyY - towerY, 2));
                    
                    // 거리 저장 (정렬용)
                    e._dist = dist;
                    
                    return dist <= effectiveRange;
                });

                if (validEnemies.length > 0) {
                    // 가까운 순 정렬
                    validEnemies.sort((a, b) => a._dist - b._dist);
                    
                    // 최대 4명 선택
                    const targets = validEnemies.slice(0, 4);
                    
                    // 6발 발사 (0.1초 간격 연사)
                    for(let i=0; i<6; i++) {
                        const t = targets[i % targets.length];
                        setTimeout(() => { if(t && t.hp > 0) shoot(tower, t, towerX, towerY); }, i * 100);
                    }
                    tower.lastShot = now;
                }
                return; // 천수 궁수 처리 완료 (다음 타워로)
            }

            // 사거리 내의 적 찾기
            const target = enemies.find(e => {
                // [특수 능력] 차원 이동자: 투명 상태면 타겟팅 불가
                if (e.isPhasing) return false;
                
                // [특수 능력] 카론의 승객: 탑승 중(무적)이면 타겟팅 불가
                if (e.invincible) return false;

                // [클래스 특성] 영혼 사슬꾼 & 빙결 도사: 이미 느려진 적은 공격하지 않음
                if ((tower.data.type === 'chainer' || tower.data.type === 'ice' || tower.data.type === 'absolutezero' || tower.data.type === 'permafrost') && e.isSlowed) {
                    return false;
                }

                // [마스터] 허공의 저격수: 거리 무시 (전체 맵)
                if (tower.data.type === 'voidsniper') {
                    return true; // 모든 적 후보 (나중에 정렬)
                }

                const enemyRect = e.element.getBoundingClientRect();
                const enemyX = enemyRect.left + enemyRect.width / 2;
                const enemyY = enemyRect.top + enemyRect.height / 2;
                
                const dist = Math.sqrt(Math.pow(enemyX - towerX, 2) + Math.pow(enemyY - towerY, 2));
                const effectiveRange = tower.range + (tower.rangeBonus || 0);
                
                // [특수 능력] 기만하는 유혹자: 사거리 진입 시 1회 회피
                if (dist <= effectiveRange && e.type === 'deceiver' && !e.hasBackstepped && !e.isSilenced) {
                    e.hasBackstepped = true;
                    // 옆으로 20%만큼 급이동 (왼쪽 또는 오른쪽 랜덤)
                    const dodgeDir = Math.random() < 0.5 ? -20 : 20;
                    e.x = Math.max(10, Math.min(90, e.x + dodgeDir)); // 화면 밖으로 나가지 않게 제한
                    e.element.style.left = `${e.x}%`;
                    return false; // 이번 틱에는 타겟팅 실패 처리 (회피했으므로)
                }

                return dist <= effectiveRange;
            });

            // [마스터] 허공의 저격수: 타겟 재설정 (문에 가장 가까운 적 = y가 가장 큰 적)
            let finalTarget = target;
            if (tower.data.type === 'voidsniper') {
                const validEnemies = enemies.filter(e => !e.isPhasing && !e.invincible);
                if (validEnemies.length > 0) {
                    validEnemies.sort((a, b) => b.y - a.y); // y 내림차순 (화면 아래쪽이 y가 큼)
                    finalTarget = validEnemies[0];
                } else {
                    finalTarget = null;
                }
            }

            if (finalTarget && finalTarget.element.isConnected) {
                shoot(tower, finalTarget, towerX, towerY);
                tower.lastShot = now;
            }
        }
    });

    requestAnimationFrame(gameLoop);
}

// 발사체 생성 및 데미지 처리
function shoot(tower, target, startX, startY) {
    // 게임 컨테이너 기준 좌표로 변환
    const gameRect = gameContainer.getBoundingClientRect();
    const relStartX = startX - gameRect.left;
    const relStartY = startY - gameRect.top;

    const proj = document.createElement('div');
    proj.classList.add('projectile');
    
    // 발사체 색상 변경 (클래스별)
    if (tower.data.type === 'chainer') proj.style.backgroundColor = '#9370db';
    else if (tower.data.type === 'talisman') proj.style.backgroundColor = '#ffa500';
    else if (tower.data.type === 'monk') proj.style.backgroundColor = '#a52a2a';
    else if (tower.data.type === 'archer') proj.style.backgroundColor = '#228b22';
    else if (tower.data.type === 'ice') proj.style.backgroundColor = '#00ffff';
    else if (tower.data.type === 'fire') proj.style.backgroundColor = '#ff4500';
    else if (tower.data.type === 'assassin') proj.style.backgroundColor = '#333333';
    else if (tower.data.type === 'tracker') proj.style.backgroundColor = '#ffffff';
    else if (tower.data.type === 'necromancer') proj.style.backgroundColor = '#8a2be2';
    else if (tower.data.type === 'guardian') proj.style.backgroundColor = '#ffd700';
    else if (tower.data.type === 'executor') proj.style.backgroundColor = '#483d8b';
    else if (tower.data.type === 'binder') proj.style.backgroundColor = '#8b008b';
    else if (tower.data.type === 'grandsealer') proj.style.backgroundColor = '#191970';
    else if (tower.data.type === 'flamemaster') proj.style.backgroundColor = '#ff4500';
    else if (tower.data.type === 'vajra') proj.style.backgroundColor = '#ffd700';
    else if (tower.data.type === 'saint') proj.style.backgroundColor = '#cd853f';
    else if (tower.data.type === 'absolutezero') proj.style.backgroundColor = '#00ffff';
    else if (tower.data.type === 'permafrost') proj.style.backgroundColor = '#f0ffff';
    else if (tower.data.type === 'hellfire') proj.style.backgroundColor = '#8b0000';
    else if (tower.data.type === 'phoenix') proj.style.backgroundColor = '#ff8c00';
    else if (tower.data.type === 'abyssal') proj.style.backgroundColor = '#4b0082';
    else if (tower.data.type === 'spatial') proj.style.backgroundColor = '#c0c0c0';
    else if (tower.data.type === 'wraithlord') proj.style.backgroundColor = '#00ff00';
    else if (tower.data.type === 'cursedshaman') proj.style.backgroundColor = '#483d8b';
    else if (tower.data.type === 'seer') proj.style.backgroundColor = '#9932cc';
    else if (tower.data.type === 'commander') proj.style.backgroundColor = '#dc143c';
    else if (tower.data.type === 'voidsniper') proj.style.backgroundColor = '#006400';
    else if (tower.data.type === 'thousandhand') proj.style.backgroundColor = '#32cd32';
    else if (tower.data.type === 'rampart') proj.style.backgroundColor = '#f5f5f5';
    else if (tower.data.type === 'judgment') proj.style.backgroundColor = '#daa520';

    proj.style.left = `${relStartX}px`;
    proj.style.top = `${relStartY}px`;
    gameContainer.appendChild(proj);

    // 목표 위치로 이동 (CSS transition 활용)
    // setTimeout을 사용하여 브라우저가 초기 위치를 렌더링한 후 이동시키도록 함
    setTimeout(() => {
        if (target.element.isConnected) {
            const targetRect = target.element.getBoundingClientRect();
            const relTargetX = (targetRect.left + targetRect.width/2) - gameRect.left;
            const relTargetY = (targetRect.top + targetRect.height/2) - gameRect.top;
            
            proj.style.left = `${relTargetX}px`;
            proj.style.top = `${relTargetY}px`;
        } else {
            proj.remove(); // 타겟이 사라지면 발사체 제거
        }
    }, 10);

    // 타격 시점 (0.2초 후)
    setTimeout(() => {
        proj.remove();
        
        // [특수 능력] 욕심쟁이 령: 피격 시 일정 확률로 공격한 타워 강제 이동
        if (target.type === 'greedy' && Math.random() < 0.3 && !target.isSilenced) { // 30% 확률 (침묵 아닐 때만)
            // 빈 슬롯 찾기
            const validSlots = slots.filter(c => !c.classList.contains('occupied'));
            if (validSlots.length > 0) {
                const newSlot = validSlots[Math.floor(Math.random() * validSlots.length)];
                const oldSlot = tower.slotElement;
                const unitElement = tower.element;

                // DOM 이동
                newSlot.appendChild(unitElement);
                
                // 상태 업데이트
                oldSlot.classList.remove('occupied');
                newSlot.classList.add('occupied');
                tower.slotElement = newSlot;
            }
        }

        // [특수 능력] 타오르는 복수심: 피격 시 체력 회복
        if (target.type === 'burning') {
            target.hp += target.maxHp * 0.02; // 2% 회복
            if (target.hp > target.maxHp) target.hp = target.maxHp;
        }

        // [클래스 특성] 영혼 사슬꾼 & 빙결 도사 계열: 이동 속도 감소 (3초간)
        if (tower.data.type === 'chainer' || tower.data.type === 'ice' || tower.data.type === 'absolutezero' || tower.data.type === 'permafrost') {
            if (!target.isSlowed) {
                target.isSlowed = true;
                if (target.element) target.element.classList.add('slowed');
                setTimeout(() => {
                    if (target && target.element) { // 대상이 살아있으면 해제
                        target.isSlowed = false;
                        target.element.classList.remove('slowed');
                    }
                }, 3000);
            }
        }

        // 치명타 여부 미리 계산 (금강역사 로직용)
        let isCritical = Math.random() < critChance;

        // [클래스 특성] 철퇴 승려 & 금강역사: 넉백 (위로 밀려남)
        if (tower.data.type === 'monk' || tower.data.type === 'vajra') {
            // 철벽형(Armoured) 중 '육중한 죄인'은 넉백 저항이 있음 (80%)
            let knockback = 30;
            
            // [마스터] 금강역사: 치명타 시 강력한 넉백
            if (tower.data.type === 'vajra' && isCritical) {
                if (target.isBoss) {
                    knockback = 100; // 보스는 크게 밀려남
                } else {
                    knockback = 1000; // 일반 적은 화면 밖으로 (사실상 즉사)
                }
            }

            if (target.data && target.data.knockbackResist) {
                knockback *= (1 - target.data.knockbackResist);
            }
            target.y = Math.max(-100, target.y - knockback); // 화면 위로 넘어갈 수 있게 허용 (금강역사 효과)
            target.element.style.top = `${target.y}px`;
        }

        // [클래스 특성] 화염 마법사 & 지옥불 연금술사: 화상 부여 (3초간)
        if (tower.data.type === 'fire' || tower.data.type === 'hellfire') {
            target.isBurning = true;
            target.burnEndTime = Date.now() + 3000;
            if (tower.data.type === 'hellfire') target.isHellfireBurn = true; // 폭발 트리거 설정
            if (target.element) target.element.classList.add('burning');
        }

        // [마스터] 명계의 집행관: 강제 귀환 (10%)
        if (tower.data.type === 'executor' && Math.random() < 0.1 && !target.isBoss) {
            // 문 앞(화면 하단)에 가까운지 확인 (예: 50% 이상 진행)
            const roadHeight = road.offsetHeight;
            if (target.y > roadHeight * 0.5) {
                target.y = 0; // 시작 지점으로
                target.element.style.top = '0px';
                // 이펙트
                target.element.style.transition = 'none'; // 즉시 이동
                setTimeout(() => target.element.style.transition = '', 50);
            }
        }

        // [마스터] 영혼 구속자: 영혼 연결
        if (tower.data.type === 'binder') {
            // 타겟과 주변 4명 연결
            const nearby = enemies.filter(e => e !== target && !e.isBoss && e.hp > 0)
                .sort((a, b) => Math.abs(a.y - target.y) - Math.abs(b.y - target.y))
                .slice(0, 4);
            const linkId = Date.now() + Math.random();
            [target, ...nearby].forEach(e => {
                e.linkId = linkId;
                e.linkEndTime = Date.now() + 5000; // 5초간 유지
                if(e.element) e.element.classList.add('soul-linked');
                setTimeout(() => { if(e.element) e.element.classList.remove('soul-linked'); }, 5000);
            });
        }

        // [마스터] 진동의 성자: 광역 스턴
        if (tower.data.type === 'saint') {
            // 타격 이펙트 (충격파)
            const shockwave = document.createElement('div');
            shockwave.style.position = 'absolute';
            shockwave.style.left = target.element ? target.element.style.left : `${target.x}%`;
            shockwave.style.top = target.element ? target.element.style.top : `${target.y}px`;
            shockwave.style.width = '100px'; shockwave.style.height = '100px';
            shockwave.style.border = '2px solid #cd853f'; shockwave.style.borderRadius = '50%';
            shockwave.style.transform = 'translate(-50%, -50%)';
            shockwave.style.zIndex = '19';
            gameContainer.appendChild(shockwave);
            setTimeout(() => shockwave.remove(), 200);

            const aoeTargets = enemies.filter(e => Math.abs(e.y - target.y) < 80 && Math.abs(e.x - target.x) < 20);
            aoeTargets.forEach(e => {
                e.isStunned = true;
                e.stunEndTime = Date.now() + 2000; // 2초 기절
                if (e.element) e.element.classList.add('stunned');
                if (e !== target) applyDamage(e, tower.data.damage * 0.5, tower); // 주변 적 50% 데미지
            });
        }

        // 데미지 처리
        let damage = tower.data.damage + (tower.damageBonus || 0);
        
        // 방어력 적용 (그림자 자객 계열은 무시)
        if (tower.data.type !== 'assassin' && tower.data.type !== 'abyssal' && tower.data.type !== 'spatial') {
            let defense = target.defense || 0;
            damage = Math.max(1, damage - defense);
        }

        damage *= damageMultiplier;

        // [클래스 특성] 성역 수호자: 즉사 (5%)
        if (tower.data.type === 'guardian' && Math.random() < 0.05 && !target.isBoss) {
            damage = target.hp; // 남은 체력만큼 데미지
            // 이펙트 추가 가능
        }

        // 치명타 계산
        if (isCritical) {
            damage *= 2; // 2배 데미지
            // 치명타 시각 효과 (간단히 크기 변화로 표현)
            if (target.element) target.element.style.transform += " scale(1.2)";
            setTimeout(() => { if(target.element) target.element.style.transform = target.element.style.transform.replace(" scale(1.2)", ""); }, 100);
        }
        
        // [마스터] 금강역사: 일반 적 치명타 시 즉사 처리 (데미지 증폭)
        if (tower.data.type === 'vajra' && isCritical && !target.isBoss) {
            damage = target.hp + 9999;
        }
        
        // [마스터] 절대영도 마법사: 얼어붙은 적 체력 30% 이하 시 즉사
        if (tower.data.type === 'absolutezero' && target.isSlowed && target.hp < target.maxHp * 0.3 && !target.isBoss) {
            damage = target.hp + 9999;
        }

        applyDamage(target, damage, tower);

        // [클래스 특성] 부적 술사 계열: 범위 공격 및 장판 생성
        if (tower.data.type === 'talisman' || tower.data.type === 'flamemaster' || tower.data.type === 'grandsealer') {
            // 폭발 이펙트 (간단히)
            const explosion = document.createElement('div');
            explosion.style.position = 'absolute';
            explosion.style.left = target.element ? target.element.style.left : `${target.x}%`; // 죽었을 경우 대비
            explosion.style.top = target.element ? target.element.style.top : `${target.y}px`;
            explosion.style.width = '60px';
            explosion.style.height = '60px';
            explosion.style.background = 'radial-gradient(circle, rgba(255,165,0,0.8), transparent)';
            explosion.style.transform = 'translate(-50%, -50%)';
            explosion.style.pointerEvents = 'none';
            explosion.style.zIndex = '19';
            gameContainer.appendChild(explosion);
            setTimeout(() => explosion.remove(), 200);

            // 부적 술사 & 화염 부적 명장: 즉시 광역 데미지
            if (tower.data.type !== 'grandsealer') {
                const aoeTargets = enemies.filter(e => e !== target && Math.abs(e.y - target.y) < 50 && Math.abs(e.x - target.x) < 15);
                aoeTargets.forEach(e => {
                    applyDamage(e, damage * 0.5, tower);
                });
            }

            // [마스터] 대봉인사: 봉인진 생성 (4초)
            if (tower.data.type === 'grandsealer') {
                const zone = document.createElement('div');
                zone.classList.add('zone-seal');
                zone.style.width = '120px'; zone.style.height = '120px';
                zone.style.left = target.element ? target.element.style.left : `${target.x}%`;
                zone.style.top = target.element ? target.element.style.top : `${target.y}px`;
                road.appendChild(zone);
                
                groundEffects.push({
                    type: 'seal', element: zone,
                    x: (target.element ? parseFloat(target.element.style.left) / 100 * gameContainer.offsetWidth : (target.x / 100 * gameContainer.offsetWidth)),
                    y: (target.element ? parseFloat(target.element.style.top) : target.y),
                    radius: 60, endTime: Date.now() + 4000
                });
            }

            // [마스터] 화염 부적 명장: 화염 지대 생성 (3초)
            if (tower.data.type === 'flamemaster') {
                const zone = document.createElement('div');
                zone.classList.add('zone-fire');
                zone.style.left = target.element ? target.element.style.left : `${target.x}%`;
                zone.style.top = target.element ? target.element.style.top : `${target.y}px`;
                road.appendChild(zone);
                
                groundEffects.push({
                    type: 'fire', element: zone,
                    x: (target.element ? parseFloat(target.element.style.left) / 100 * gameContainer.offsetWidth : (target.x / 100 * gameContainer.offsetWidth)),
                    y: (target.element ? parseFloat(target.element.style.top) : target.y),
                    radius: 40, endTime: Date.now() + 3000
                });
            }
        }

        // [마스터] 만년설의 신녀: 눈보라 지대 생성 (3초)
        if (tower.data.type === 'permafrost') {
            const zone = document.createElement('div');
            zone.classList.add('zone-blizzard');
            zone.style.width = '120px'; zone.style.height = '120px';
            zone.style.left = target.element ? target.element.style.left : `${target.x}%`;
            zone.style.top = target.element ? target.element.style.top : `${target.y}px`;
            road.appendChild(zone);
            
            groundEffects.push({
                type: 'blizzard', element: zone,
                x: (target.element ? parseFloat(target.element.style.left) / 100 * gameContainer.offsetWidth : (target.x / 100 * gameContainer.offsetWidth)),
                y: (target.element ? parseFloat(target.element.style.top) : target.y),
                radius: 60, endTime: Date.now() + 3000
            });
        }

        // [마스터] 불사조 소환사: 불의 길 생성 (3초 유지)
        if (tower.data.type === 'phoenix') {
            // 타워(발사체 시작점)에서 타겟까지의 경로 계산
            const startX = parseFloat(proj.style.left) || 0;
            const startY = parseFloat(proj.style.top) || 0;
            
            const targetRect = target.element.getBoundingClientRect();
            const gameRect = gameContainer.getBoundingClientRect();
            const endX = (targetRect.left + targetRect.width/2) - gameRect.left;
            const endY = (targetRect.top + targetRect.height/2) - gameRect.top;

            const dist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const steps = Math.floor(dist / 30); // 30px 간격으로 불길 생성

            for(let i=0; i<=steps; i++) {
                const t = i / steps;
                const x = startX + (endX - startX) * t;
                const y = startY + (endY - startY) * t;

                const zone = document.createElement('div');
                zone.classList.add('zone-fire');
                zone.style.left = `${x}px`;
                zone.style.top = `${y}px`;
                gameContainer.appendChild(zone); // 불길은 게임 컨테이너에 추가 (road 위)
                
                groundEffects.push({
                    type: 'fire', element: zone,
                    x: x, y: y,
                    radius: 30, endTime: Date.now() + 3000
                });
            }
        }

        // [마스터] 공간 참격자: 분신 소환 (15% 확률)
        if (tower.data.type === 'spatial' && Math.random() < 0.15) {
            // 빈 슬롯 찾기
            const validSlots = slots.filter(c => !c.classList.contains('occupied'));
            if (validSlots.length > 0) {
                const cloneSlot = validSlots[Math.floor(Math.random() * validSlots.length)];
                
                // 분신 생성 (시각적)
                const cloneUnit = document.createElement('div');
                cloneUnit.classList.add('unit', 'spatial', 'clone');
                cloneSlot.appendChild(cloneUnit);
                cloneSlot.classList.add('occupied'); // 잠시 점유

                // 가장 위협적인 적 찾기 (문에 가장 가까운 적 = y가 가장 큰 적)
                const threat = enemies.filter(e => !e.isPhasing && !e.invincible && e.hp > 0)
                                      .sort((a, b) => b.y - a.y)[0];

                if (threat) {
                    // 분신이 공격 (즉시 발사체 생성)
                    const cloneRect = cloneSlot.getBoundingClientRect();
                    const cloneX = cloneRect.left + cloneRect.width / 2;
                    const cloneY = cloneRect.top + cloneRect.height / 2;
                    
                    // 가짜 타워 객체 생성하여 shoot 호출
                    const cloneTower = { data: tower.data, element: cloneUnit, slotElement: cloneSlot, range: 9999, cooldown: 0 };
                    shoot(cloneTower, threat, cloneX, cloneY);
                }

                // 0.5초 후 분신 제거
                setTimeout(() => {
                    cloneUnit.remove();
                    cloneSlot.classList.remove('occupied');
                }, 500);
            }
        }

        // [마스터] 저주받은 주술사: 광역 최대 체력 감소 저주
        if (tower.data.type === 'cursedshaman') {
            // 타격 이펙트
            const curseZone = document.createElement('div');
            curseZone.style.position = 'absolute';
            curseZone.style.left = target.element ? target.element.style.left : `${target.x}%`;
            curseZone.style.top = target.element ? target.element.style.top : `${target.y}px`;
            curseZone.style.width = '120px'; curseZone.style.height = '120px';
            curseZone.style.background = 'radial-gradient(circle, rgba(72, 61, 139, 0.6), transparent)';
            curseZone.style.transform = 'translate(-50%, -50%)';
            curseZone.style.zIndex = '19';
            gameContainer.appendChild(curseZone);
            setTimeout(() => curseZone.remove(), 300);

            const aoeTargets = enemies.filter(e => Math.abs(e.y - target.y) < 60 && Math.abs(e.x - target.x) < 15);
            aoeTargets.forEach(e => {
                if (!e.isCursed && !e.isBoss) { // 보스는 면역 또는 감소폭 조정 가능 (여기선 일반적용)
                    e.maxHp *= 0.7; // 최대 체력 30% 감소
                    e.hp = Math.min(e.hp, e.maxHp); // 현재 체력이 최대 체력을 넘지 않도록 조정
                    e.isCursed = true;
                    if (e.element) e.element.classList.add('cursed');
                }
            });
        }

        // [마스터] 심판의 기사: 광역 신성 데미지 (15%)
        if (tower.data.type === 'judgment' && Math.random() < 0.15) {
            const flash = document.createElement('div');
            flash.classList.add('holy-flash');
            gameContainer.appendChild(flash);
            setTimeout(() => flash.remove(), 200);

            enemies.forEach(e => {
                if (e.hp > 0) applyDamage(e, tower.data.damage, tower);
            });
        }

        // [클래스 특성] 강령술사: 벽 소환 (30%)
        if (tower.data.type === 'necromancer' && Math.random() < 0.3) {
            const wall = document.createElement('div');
            wall.classList.add('spirit-wall');
            // 타겟 위치에 생성 (road 기준)
            wall.style.left = target.element.style.left;
            wall.style.top = target.element.style.top;
            road.appendChild(wall);
            
            walls.push({
                element: wall,
                x: target.x, // % 단위
                y: target.y, // px 단위
                endTime: Date.now() + 1500 // 1.5초 지속
            });
        }
    }, 200);
}

// 게임 시작 (2초마다 적 생성)
initStage();
initAllies();
updateSummonButtonState();
gameLoop();
